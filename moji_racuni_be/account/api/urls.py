from django.urls import path
from .views import UserViewSet
from .views import MyTokenObtainPairView

from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

urlpatterns = [
    path('users/', UserViewSet.as_view({'get': 'list', 'post' : 'create'}), name='users'),
    path('users/<int:pk>/', UserViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='user-details'),
    path('users/update-password/<int:pk>/', UserViewSet.as_view({'put': 'update_password'}), name='user-password'),
    path('users/<str:username>/', UserViewSet.as_view({'get' : 'user_exists'}), name='user-existence'),
    path('admins/', UserViewSet.as_view({'post' : 'create_admin'}), name='admins'),
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
