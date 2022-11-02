from rest_framework.response import Response
from rest_framework.decorators import permission_classes
from rest_framework import viewsets
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .serializers import CompanySerializer, CompanyUnitSerializer, CompanyTypeSerializer
from company.models import CompanyType, Company, CompanyUnit

@permission_classes([IsAuthenticated])
class CompanyViewSet(viewsets.ViewSet):
    def list(self, request):
        companies = Company.objects.all()
        serializer = CompanySerializer(companies, many=True)
        return Response(serializer.data)

    def create(self, request):
        '''
        #TODO: Proveriti da li vec postoji preduzece sa istim PIB-om,
        ako postoji vratiti ga u odgovoru, ali prvo proveriti da li se naziv preduzeca razlikuje,
        ako se razlikuje promeniti naziv pre slanja odgovora. Ako ne postoji napraviti novo.
        '''
        serializer = CompanySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, pk=None):
        queryset = Company.objects.all()
        company = get_object_or_404(queryset, pk=pk)
        serializer = CompanySerializer(company)
        return Response(serializer.data)

    def destroy(self, request, pk=None):
        #TODO: Proveriti da li je zahtev poslao admin
        company = Company.objects.get(pk=pk)
        company.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
@permission_classes([IsAuthenticated])
class CompanyUnitViewSet(viewsets.ViewSet):
    def list(self, request):
        companyUnits = CompanyUnit.objects.all()
        serializer = CompanyUnitSerializer(companyUnits, many=True)
        return Response(serializer.data)

    def create(self, request):
        '''
        #TODO: Proveriti da li ovo prodajno mesto vec postoji,
        ako postoji vratiti ga u odgovoru, a ako ne postoji napraviti novo.
        '''
        serializer = CompanyUnitSerializer(data=request.data)
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
        #TODO: Proveriti da li je zahtev poslao admin
        companyUnit = CompanyUnit.objects.get(pk=pk)
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
        companyType = CompanyType.objects.get(pk=pk)
        user = request.user
        if (companyType.user != user):
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = CompanyTypeSerializer(companyType, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        companyType = CompanyType.objects.get(pk=pk)
        user = request.user
        if (companyType.user != user):
            return Response(status=status.HTTP_404_NOT_FOUND)
        companyType.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)