from django.urls import path

from .views import MyTokenBlacklistView, MyTokenObtainPairView, MyTokenRefreshView, UserViewSet

urlpatterns = [
    path('users/filter/', UserViewSet.as_view({'get': 'filter_users'}), name='user-filter'),
    path('users/', UserViewSet.as_view({'post': 'create'}), name='users'),
    path('users/<int:pk>/', UserViewSet.as_view({'get': 'retrieve', 'put': 'update'}), name='user-details'),
    path('users/update-password/<int:pk>/', UserViewSet.as_view({'put': 'update_password'}), name='user-password'),
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', MyTokenRefreshView.as_view(), name='token_refresh'),
    path('token/blacklist/', MyTokenBlacklistView.as_view(), name='token_blacklist'),
]
