from dataclasses import field
from pyexpat import model
from rest_framework.serializers import ModelSerializer
from account.models import User

class UserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'date_joined', 'is_active']