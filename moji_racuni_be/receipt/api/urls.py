from django.urls import path, include
from .views import ReceiptViewSet, ItemViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register('receipt', ReceiptViewSet, basename='receipt')
router.register('receipt-items', ItemViewSet, basename='receipt')

urlpatterns = [
    path('', include(router.urls))
]
