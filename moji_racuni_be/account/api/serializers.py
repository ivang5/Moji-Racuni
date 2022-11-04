from dataclasses import field
from pyexpat import model
from rest_framework.serializers import ModelSerializer
from account.models import User, Admin

class UserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'date_joined', 'is_active']
        
class AdminSerializer(ModelSerializer):
    class Meta:
        model = Admin
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'date_joined', 'is_active']