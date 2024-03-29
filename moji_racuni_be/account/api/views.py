from rest_framework.response import Response
from rest_framework.decorators import permission_classes, api_view
from rest_framework import viewsets
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.shortcuts import get_object_or_404
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from .serializers import UserSerializer, AdminSerializer
from account.models import User
from django.contrib.auth.hashers import make_password
from moji_racuni_be import utils

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

class UserViewSet(viewsets.ViewSet):
    def list(self, request):
        try:
            if (request.user.role == "ADMIN"):
                users = User.objects.all()
                serializer = UserSerializer(users, many=True)
                return Response(serializer.data)
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        except AttributeError:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        
    @action(detail=False)
    def filter_users(self, request):
        if (request.user.role != "ADMIN"):
            return Response(status=status.HTTP_401_UNAUTHORIZED)
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
    
    @action(detail=True, methods=['post'])
    def create_admin(self, request):
        try:
            if (request.user.role != "ADMIN"):
                return Response(status=status.HTTP_401_UNAUTHORIZED)
        except AttributeError:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        users = User.objects.all()
        username = request.data.get('username')
        for user in users:
            if (user.username == username):
                return Response(status=status.HTTP_409_CONFLICT)
        serializer = AdminSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def create(self, request):
        users = User.objects.all()
        username = request.data.get('username')
        for user in users:
            if (user.username == username):
                return Response(status=status.HTTP_409_CONFLICT)
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True)
    def user_exists(self, request, username):
        queryset = User.objects.all()
        get_object_or_404(queryset, username=username)
        return Response(data=True)
    
    def retrieve(self, request, pk=None):
        try:
            if (request.user.role != "ADMIN" and pk != request.user.id):
                return Response(status=status.HTTP_401_UNAUTHORIZED)
        except AttributeError:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        queryset = User.objects.all()
        user = get_object_or_404(queryset, pk=pk)
        serializer = UserSerializer(user)
        return Response(serializer.data)
    
    def update(self, request, pk=None):
        try:
            if (request.user.role != "ADMIN" and pk != request.user.id):
                return Response(status=status.HTTP_401_UNAUTHORIZED)
            users = User.objects.all()
            for u in users:
                if (u.username == request.data["username"] and request.user.username != request.data["username"]):
                    if (request.user.role != "ADMIN" or u.id != pk):
                        return Response(status=status.HTTP_409_CONFLICT)
            user = get_object_or_404(User, pk=pk)
            user.username = request.data["username"]
            user.email = request.data["email"]
            if (request.user.role == "ADMIN"):
                user.is_active = request.data["is_active"]
            user.save()
            serializer = UserSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except AttributeError:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        except KeyError:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        
    @action(detail=True, methods=['put'])
    def update_password(self, request, pk=None):
        try:
            if (request.user.role != "ADMIN" and pk != request.user.id):
                return Response(status=status.HTTP_401_UNAUTHORIZED)
            user = get_object_or_404(User, pk=pk)
            user.password = make_password(request.data["password"])
            user.save()
            serializer = UserSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except AttributeError:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        except KeyError:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        
    def destroy(self, request, pk=None):
        try:
            if (request.user.role != "ADMIN"):
                return Response(status=status.HTTP_401_UNAUTHORIZED)
        except AttributeError:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        user = get_object_or_404(User, pk=pk)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)