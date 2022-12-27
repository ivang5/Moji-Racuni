from django.urls import path, include
from .views import ReceiptViewSet, ItemViewSet, ReportViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register('receipts', ReceiptViewSet, basename='receipts')
router.register('items', ItemViewSet, basename='receipt-items')
router.register('reports', ReportViewSet, basename='reports')

urlpatterns = [
    path('', include(router.urls)),
]
