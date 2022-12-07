from django.urls import path, include
from .views import ReceiptViewSet, ItemViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register('receipts', ReceiptViewSet, basename='receipts')
router.register('items', ItemViewSet, basename='receipt-items')

urlpatterns = [
    path('', include(router.urls)),
]
