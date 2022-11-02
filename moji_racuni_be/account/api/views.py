from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import UserSerializer
from account.models import User

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['username'] = user.username
        # ...

        return token

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

@api_view(['GET'])
def getRoutes(reqest):
    routes = [
        '/api/token',
        '/api/token/refresh',
    ]
    
    return Response(routes)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getUsers(reqest):
    users = User.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)