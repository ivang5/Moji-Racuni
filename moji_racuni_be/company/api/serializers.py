from dataclasses import field
from pyexpat import model
from rest_framework.serializers import ModelSerializer
from company.models import CompanyType
from company.models import Company
from company.models import CompanyUnit

class CompanySerializer(ModelSerializer):
    class Meta:
        model = Company
        fields = '__all__'
        
class CompanyUnitSerializer(ModelSerializer):
    class Meta:
        model = CompanyUnit
        fields = '__all__'
        
class CompanyTypeSerializer(ModelSerializer):
    class Meta:
        model = CompanyType
        fields = '__all__'