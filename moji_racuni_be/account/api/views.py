from django.contrib.auth import get_user_model
from django.core.paginator import EmptyPage, PageNotAnInteger, Paginator
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.views import TokenBlacklistView, TokenObtainPairView, TokenRefreshView

from account.models import User
from moji_racuni_be import utils
from moji_racuni_be.permissions import IsAdminRole
from .serializers import (
    AdminUserUpdateSerializer,
    PasswordChangeSerializer,
    RegistrationSerializer,
    UserSerializer,
    UserUpdateSerializer,
)


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Custom claims
        token['username'] = user.username
        token['role'] = user.role
        return token


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    throttle_scope = 'login'


class MyTokenRefreshSerializer(TokenRefreshSerializer):
    """Refresh token obrisanog korisnika daje 401 (kao i token neaktivnog korisnika), a ne 500."""

    def validate(self, attrs):
        try:
            return super().validate(attrs)
        except get_user_model().DoesNotExist as e:
            raise AuthenticationFailed(self.error_messages['no_active_account'], 'no_active_account') from e


class MyTokenRefreshView(TokenRefreshView):
    serializer_class = MyTokenRefreshSerializer
    throttle_scope = 'token_refresh'


class MyTokenBlacklistView(TokenBlacklistView):
    """Odjava: refresh token se stavlja na crnu listu."""

    throttle_scope = 'token_refresh'


def blacklist_refresh_tokens(user):
    """Poništava sve refresh tokene korisnika (već izdati access tokeni važe do isteka)."""
    tokens = OutstandingToken.objects.filter(user=user, blacklistedtoken__isnull=True)
    BlacklistedToken.objects.bulk_create(
        [BlacklistedToken(token=token) for token in tokens], ignore_conflicts=True
    )


def _request_value(request, key):
    return request.data.get(key) if hasattr(request.data, 'get') else None


class UserViewSet(viewsets.ViewSet):
    #* ScopedRateThrottle čita throttle_scope sa view-a; ograničavaju se registracija i promena lozinke
    THROTTLE_SCOPES = {'create': 'register', 'update_password': 'password'}

    @property
    def throttle_scope(self):
        return self.THROTTLE_SCOPES.get(self.action)

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        if self.action == 'filter_users':
            return [IsAdminRole()]
        return super().get_permissions()

    def _visible_users(self, request):
        """ADMIN vidi sve korisnike, REGULAR samo sebe (tuđi nalog -> 404)."""
        if request.user.role == User.Role.ADMIN:
            return User.objects.all()
        return User.objects.filter(pk=request.user.pk)

    @action(detail=False)
    def filter_users(self, request):
        id = self.request.query_params.get('id')
        username = self.request.query_params.get('username')
        email = self.request.query_params.get('email')
        orderBy = self.request.query_params.get('orderBy')
        ascendingOrder = self.request.query_params.get('ascendingOrder')
        if (not id or not username or not email or not orderBy or not ascendingOrder):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        filtered_users = utils.filter_users(id, username, email, orderBy, ascendingOrder)
        p = Paginator(filtered_users, 12)
        try:
            page = p.page(self.request.query_params.get('page'))
        except (EmptyPage, PageNotAnInteger):
            page = p.page(1)
        res = {
            "pageCount": p.num_pages,
            "pageNum": page.number,
            "users": page.object_list
        }
        return Response(res)

    def create(self, request):
        username = _request_value(request, 'username')
        if username and User.objects.filter(username=username).exists():
            return Response(status=status.HTTP_409_CONFLICT)
        serializer = RegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, pk=None):
        user = get_object_or_404(self._visible_users(request), pk=pk)
        serializer = UserSerializer(user)
        return Response(serializer.data)

    def update(self, request, pk=None):
        user = get_object_or_404(self._visible_users(request), pk=pk)
        username = _request_value(request, 'username')
        if username and User.objects.filter(username=username).exclude(pk=user.pk).exists():
            return Response(status=status.HTTP_409_CONFLICT)
        #* Administrator (de)aktivira druge naloge, ali ne i sopstveni (ne može sam sebe da zaključa)
        if request.user.role == User.Role.ADMIN and user.pk != request.user.pk:
            serializer_class = AdminUserUpdateSerializer
        else:
            serializer_class = UserUpdateSerializer
        serializer = serializer_class(user, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['put'])
    def update_password(self, request, pk=None):
        #* Samo sopstvena lozinka (uz trenutnu lozinku); tuđi nalog -> 404
        user = get_object_or_404(User.objects.filter(pk=request.user.pk), pk=pk)
        serializer = PasswordChangeSerializer(data=request.data, context={'user': user})
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            user.set_password(serializer.validated_data['password'])
            user.save(update_fields=['password'])
            #* Promena lozinke odjavljuje sve druge sesije; tekuća dobija nov par tokena
            blacklist_refresh_tokens(user)
            refresh = MyTokenObtainPairSerializer.get_token(user)
        return Response(
            {'refresh': str(refresh), 'access': str(refresh.access_token)}, status=status.HTTP_200_OK
        )
