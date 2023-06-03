from dataclasses import field
from pyexpat import model
from rest_framework.serializers import ModelSerializer
from account.models import User, Admin

class UserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'email', 'role', 'date_joined', 'is_active']
        extra_kwargs = {'password': {
            'write_only':True,
            'required': True
        }}
    
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
        
class AdminSerializer(ModelSerializer):
    class Meta:
        model = Admin
        fields = ['id', 'username', 'email', 'role', 'date_joined', 'is_active']