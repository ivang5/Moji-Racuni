from rest_framework.response import Response
from rest_framework.decorators import permission_classes
from rest_framework import viewsets
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
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
    
    @action(detail=False, url_path='visited', url_name='visited')
    def visited(self, request):
        user = request.user
        dateFrom = self.request.query_params.get('dateFrom')
        dateTo = self.request.query_params.get('dateTo')
        if (not dateFrom or not dateTo):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        visited_info = utils.count_visited_companies(user, dateFrom, dateTo)
        return Response(visited_info)
    
    @action(detail=False, url_path='most-spent', url_name='most-spent')
    def most_spent(self, request):
        user = request.user
        dateFrom = self.request.query_params.get('dateFrom')
        dateTo = self.request.query_params.get('dateTo')
        limit = self.request.query_params.get('limit')
        if (not dateFrom or not dateTo):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        try:
            most_spent_info = utils.get_most_spent_companies(user, dateFrom, dateTo, int(limit))
            return Response(most_spent_info)
        except ValueError:
            return Response(status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, url_path='most-visited', url_name='most-visited')
    def most_visited(self, request):
        user = request.user
        dateFrom = self.request.query_params.get('dateFrom')
        dateTo = self.request.query_params.get('dateTo')
        limit = self.request.query_params.get('limit')
        if (not dateFrom or not dateTo):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        try:
            most_visited_info = utils.get_most_visited_companies(user, dateFrom, dateTo, int(limit))
            return Response(most_visited_info)
        except ValueError:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        
    @action(detail=False, url_path='filter', url_name='filter')
    def filter_companies(self, request):
        user = request.user
        name = self.request.query_params.get('name')
        tin = self.request.query_params.get('tin')
        type = self.request.query_params.get('type')
        orderBy = self.request.query_params.get('orderBy')
        ascendingOrder = self.request.query_params.get('ascendingOrder')
        if (not name or not tin or not type or not orderBy or not ascendingOrder):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        filtered_companies = utils.filter_companies(user, name, tin, type, orderBy, ascendingOrder)
        p = Paginator(filtered_companies, 12)
        try:
            page = p.page(self.request.query_params.get('page'))
        except (EmptyPage, PageNotAnInteger):
            page = p.page(1)
        res = {
            "pageCount": p.num_pages,
            "pageNum": page.number,
            "companies": page.object_list
        }
        return Response(res)

    def create(self, request):
        companies = Company.objects.all()
        company = utils.retrieve_company(request.data.get('url'))
        if not company:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        company_tin = company['tin']
        for c in companies:
            if c.tin == company_tin:
                serializer = CompanySerializer(c, data=company)
                if serializer.is_valid():
                    serializer.save()
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
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
    
    @action(detail=True, url_path='visits', url_name='visits')
    def visits(self, request, pk=None):
        user = request.user
        try:
            company_visits = utils.get_company_visits(user, pk)
            return Response(company_visits)
        except ValueError:
            return Response(status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['put'], url_path='change-type', url_name='change_type')
    def change_type(self, request, pk=None):
        user = request.user
        company_queryset = Company.objects.all()
        company = get_object_or_404(company_queryset, pk=pk)
        type = request.data.get('type')
        type_queryset = user.companytype_set.all()
        if (type != 'none'):
            company_type = get_object_or_404(type_queryset, pk=type)
        for comp_type in company.type.all():
            for user_type in type_queryset:
                if (comp_type.id == user_type.id):
                    company.type.remove(user_type)
        if (type != 'none'):
            company.type.add(company_type)
        company.save()
        serializer = CompanySerializer(company)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['put'], url_path='change-img', url_name='change_img')
    def change_img(self, request, pk=None):
        user = request.user
        if (user.role != "ADMIN"):
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        company_queryset = Company.objects.all()
        company = get_object_or_404(company_queryset, pk=pk)
        img = request.data.get('img')
        company.image = img
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
        allUnits = CompanyUnit.objects.all()
        companyUnits = []
        tin = self.request.query_params.get('tin')
        if (not tin):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        for unit in allUnits:
            if unit.company.tin == int(tin):
                companyUnits.append(unit)
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
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
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
    
    @action(detail=False, url_path='most-spent', url_name='most-spent')
    def most_spent(self, request):
        user = request.user
        dateFrom = self.request.query_params.get('dateFrom')
        dateTo = self.request.query_params.get('dateTo')
        limit = self.request.query_params.get('limit')
        if (not dateFrom or not dateTo):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        try:
            most_spent_info = utils.get_most_spent_types(user, dateFrom, dateTo, int(limit))
            return Response(most_spent_info)
        except ValueError:
            return Response(status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, url_path='most-visited', url_name='most-visited')
    def most_visited(self, request):
        user = request.user
        dateFrom = self.request.query_params.get('dateFrom')
        dateTo = self.request.query_params.get('dateTo')
        limit = self.request.query_params.get('limit')
        if (not dateFrom or not dateTo):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        try:
            most_visited_info = utils.get_most_visited_types(user, dateFrom, dateTo, int(limit))
            return Response(most_visited_info)
        except ValueError:
            return Response(status=status.HTTP_400_BAD_REQUEST)

    def create(self, request):
        user = request.user
        companyTypes = user.companytype_set.all()
        for type in companyTypes:
            if type.name == request.data["name"]:
                return Response(status=status.HTTP_409_CONFLICT)
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
    
    @action(detail=False, url_path='company', url_name='company')
    def get_by_company(self, request):
        user = request.user
        companyTypes = user.companytype_set.all()
        tin = self.request.query_params.get('tin')
        if (not tin):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        queryset = Company.objects.all()
        company = get_object_or_404(queryset, pk=int(tin))
        companyType = None
        for type in companyTypes:
            for compType in company.type.all():
                if (type.id == compType.id):
                    companyType = type
                    break
        if (companyType):
            serializer = CompanyTypeSerializer(companyType)
            return Response(serializer.data)
        return Response(companyType)

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