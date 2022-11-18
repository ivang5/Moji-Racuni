from rest_framework.response import Response
from rest_framework.decorators import permission_classes
from rest_framework import viewsets
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from .serializers import CompanySerializer, CompanyUnitSerializer, CompanyTypeSerializer
from company.models import CompanyType, Company, CompanyUnit
from moji_racuni_be import utils

@permission_classes([IsAuthenticated])
class CompanyViewSet(viewsets.ViewSet):
    def list(self, request):
        companies = Company.objects.all()
        serializer = CompanySerializer(companies, many=True)
        return Response(serializer.data)

    def create(self, request):
        companies = Company.objects.all()
        company = utils.retrieve_company(request.data.get('url'))
        company_tin = company['tin']
        for c in companies:
            if c.tin == company_tin:
                serializer = CompanySerializer(c, data=company)
                if serializer.is_valid():
                    serializer.save()
                    return Response(serializer.data, status=status.HTTP_200_OK)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                    
        serializer = CompanySerializer(data=company)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, pk=None):
        queryset = Company.objects.all()
        company = get_object_or_404(queryset, pk=pk)
        serializer = CompanySerializer(company)
        return Response(serializer.data)
    
    @action(detail=True, methods=['put'], url_path='change-type', url_name='change_type')
    def change_type(self, request, pk=None):
        company_queryset = Company.objects.all()
        company = get_object_or_404(company_queryset, pk=pk)
        type = request.data.get('type')
        type_queryset = CompanyType.objects.all()
        company_type = get_object_or_404(type_queryset, pk=type)
        company.type = company_type
        company.save()
        serializer = CompanySerializer(company)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def destroy(self, request, pk=None):
        user = request.user
        if (user.role != "ADMIN"):
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        company = get_object_or_404(Company, pk=pk)
        company.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
@permission_classes([IsAuthenticated])
class CompanyUnitViewSet(viewsets.ViewSet):
    def list(self, request):
        companyUnits = CompanyUnit.objects.all()
        serializer = CompanyUnitSerializer(companyUnits, many=True)
        return Response(serializer.data)

    def create(self, request):
        companyUnits = CompanyUnit.objects.all()
        companyUnit = utils.retrieve_company_unit(request.data.get('url'), request.data.get('company'))
        for unit in companyUnits:
            if unit.name == companyUnit["name"] and unit.address == companyUnit["address"] and unit.company.tin == companyUnit["company"]:
                serializer = CompanyUnitSerializer(unit, data=companyUnit)
                if serializer.is_valid():
                    serializer.save()
                    return Response(serializer.data, status=status.HTTP_200_OK)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        serializer = CompanyUnitSerializer(data=companyUnit)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, pk=None):
        queryset = CompanyUnit.objects.all()
        companyUnit = get_object_or_404(queryset, pk=pk)
        serializer = CompanyUnitSerializer(companyUnit)
        return Response(serializer.data)

    def destroy(self, request, pk=None):
        user = request.user
        if (user.role != "ADMIN"):
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        companyUnit = get_object_or_404(CompanyUnit, pk=pk)
        companyUnit.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@permission_classes([IsAuthenticated])
class CompanyTypeViewSet(viewsets.ViewSet):
    def list(self, request):
        user = request.user
        companyTypes = user.companytype_set.all()
        serializer = CompanyTypeSerializer(companyTypes, many=True)
        return Response(serializer.data)

    def create(self, request):
        serializer = CompanyTypeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, pk=None):
        queryset = CompanyType.objects.all()
        companyType = get_object_or_404(queryset, pk=pk)
        user = request.user
        if (companyType.user != user):
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = CompanyTypeSerializer(companyType)
        return Response(serializer.data)

    def update(self, request, pk=None):
        companyType = get_object_or_404(CompanyType, pk=pk)
        user = request.user
        if (companyType.user != user):
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = CompanyTypeSerializer(companyType, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        companyType = get_object_or_404(CompanyType, pk=pk)
        user = request.user
        if (companyType.user != user):
            return Response(status=status.HTTP_404_NOT_FOUND)
        companyType.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)