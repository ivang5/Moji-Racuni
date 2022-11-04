from django.urls import path, include
from .views import CompanyViewSet, CompanyUnitViewSet, CompanyTypeViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register('companies', CompanyViewSet, basename='companies')
router.register('company/units', CompanyUnitViewSet, basename='company-units')
router.register('company/types', CompanyTypeViewSet, basename='company-types')

urlpatterns = [
    path('', include(router.urls))
]
