from django.urls import path, include
from .views import CompanyViewSet, CompanyUnitViewSet, CompanyTypeViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register('company', CompanyViewSet, basename='company')
router.register('company-units', CompanyUnitViewSet, basename='company')
router.register('company-types', CompanyTypeViewSet, basename='company')

urlpatterns = [
    path('', include(router.urls))
]
