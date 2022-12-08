from rest_framework.response import Response
from rest_framework.decorators import permission_classes
from rest_framework import viewsets
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from .serializers import ReceiptSerializer, ItemSerializer
from receipt.models import Receipt, Item
from moji_racuni_be import utils

@permission_classes([IsAuthenticated])
class ReceiptViewSet(viewsets.ViewSet):
    def list(self, request):
        user = request.user
        if (user.role == "ADMIN"):
            receipts = Receipt.objects.all()
        else:
            receipts = user.receipt_set.all()
        serializer = ReceiptSerializer(receipts, many=True)
        return Response(serializer.data)
    
    @action(detail=False, url_path='total-spent', url_name='total-spent')
    def total_spent(self, request):
        user = request.user
        dateFrom = self.request.query_params.get('dateFrom')
        dateTo = self.request.query_params.get('dateTo')
        if (not dateFrom or not dateTo):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        total_spent_info = utils.get_total_spent(user, dateFrom, dateTo)
        return Response(total_spent_info)
    
    @action(detail=False, url_path='hours-count', url_name='hours-count')
    def receipts_by_hour(self, request):
        user = request.user
        dateFrom = self.request.query_params.get('dateFrom')
        dateTo = self.request.query_params.get('dateTo')
        if (not dateFrom or not dateTo):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        receipts_count_by_hours = utils.get_receipts_sum_by_hours(user, dateFrom, dateTo)
        return Response(receipts_count_by_hours)
    
    @action(detail=False, url_path='weekdays-count', url_name='weekdays-count')
    def receipts_by_weekday(self, request):
        user = request.user
        dateFrom = self.request.query_params.get('dateFrom')
        dateTo = self.request.query_params.get('dateTo')
        if (not dateFrom or not dateTo):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        receipts_count_by_days = utils.get_receipts_sum_by_weekdays(user, dateFrom, dateTo)
        return Response(receipts_count_by_days)
    
    @action(detail=False, url_path='months-count', url_name='months-count')
    def receipts_by_month(self, request):
        user = request.user
        dateFrom = self.request.query_params.get('dateFrom')
        dateTo = self.request.query_params.get('dateTo')
        if (not dateFrom or not dateTo):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        receipts_count_by_months = utils.get_receipts_sum_by_months(user, dateFrom, dateTo)
        return Response(receipts_count_by_months)

    def create(self, request):
        user = request.user
        if (user.role == "ADMIN"):
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        receipts = user.receipt_set.all()
        receipt_link = request.data.get('url')
        for receipt in receipts:
            if (receipt.link == receipt_link):
                return Response(status=status.HTTP_409_CONFLICT)
        receipt = utils.retrieve_receipt(request.data.get('url'), request.data.get('companyUnit'), user.id)
        serializer = ReceiptSerializer(data=receipt)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, pk=None):
        queryset = Receipt.objects.all()
        receipt = get_object_or_404(queryset, pk=pk)
        user = request.user
        if (receipt.user != user):
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = ReceiptSerializer(receipt)
        return Response(serializer.data)
    
    @action(detail=False, url_path='last', url_name='last')
    def retrieve_last(self, request):
        user = request.user
        if (user.role == "ADMIN"):
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        receipt = utils.get_last_receipt(user)
        if (receipt == None):
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(receipt)

    def destroy(self, request, pk=None):
        receipt = get_object_or_404(Receipt, pk=pk)
        user = request.user
        if (receipt.user != user):
            return Response(status=status.HTTP_404_NOT_FOUND)
        receipt.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
@permission_classes([IsAuthenticated])
class ItemViewSet(viewsets.ViewSet):
    def list(self, request):
        user = request.user
        if (user.role != "ADMIN"):
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        items = Item.objects.all()
        serializer = ItemSerializer(items, many=True)
        return Response(serializer.data)
    
    @action(detail=True, url_path='receipt', url_name='receipt')
    def all(self, request, pk=None):
        queryset = Receipt.objects.all()
        receipt = get_object_or_404(queryset, pk=pk)
        items = receipt.item_set.all()
        serializer = ItemSerializer(items, many=True)    
        return Response(serializer.data)
    
    @action(detail=False, url_path='most-valuable', url_name='most-valuable')
    def most_valuable(self, request):
        user = request.user
        dateFrom = self.request.query_params.get('dateFrom')
        dateTo = self.request.query_params.get('dateTo')
        limit = self.request.query_params.get('limit')
        if (not dateFrom or not dateTo):
            return Response(status=status.HTTP_400_BAD_REQUEST)
        try:
            item = utils.get_most_valuable_items(user, dateFrom, dateTo, int(limit))
            return Response(item)
        except ValueError:
            return Response(status=status.HTTP_400_BAD_REQUEST)

    def create(self, request):
        user = request.user
        if (user.role == "ADMIN"):
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        items = utils.retrieve_items(request.data.get('url'), request.data.get('receipt'))
        is_valid = True
        for item in items:
            serializer = ItemSerializer(data=item)
            if serializer.is_valid():
                serializer.save()
            else:
                is_valid = False
        if is_valid:
            return Response(items, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, pk=None):
        queryset = Item.objects.all()
        item = get_object_or_404(queryset, pk=pk)
        serializer = ItemSerializer(item)
        return Response(serializer.data)
    
    def update(self, request, pk=None):
        user = request.user
        if (user.role == "ADMIN"):
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        item = get_object_or_404(Item, pk=pk)
        serializer = ItemSerializer(item, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        user = request.user
        if (user.role == "ADMIN"):
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        item = get_object_or_404(Item, pk=pk)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)