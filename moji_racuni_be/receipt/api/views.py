from rest_framework.response import Response
from rest_framework.decorators import permission_classes
from rest_framework import viewsets
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .serializers import ReceiptSerializer, ItemSerializer
from receipt.models import Receipt, Item

@permission_classes([IsAuthenticated])
class ReceiptViewSet(viewsets.ViewSet):
    def list(self, request):
        user = request.user
        receipts = user.receipt_set.all()
        serializer = ReceiptSerializer(receipts, many=True)
        return Response(serializer.data)

    def create(self, request):
        serializer = ReceiptSerializer(data=request.data)
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

    def destroy(self, request, pk=None):
        receipt = Receipt.objects.get(pk=pk)
        user = request.user
        if (receipt.user != user):
            return Response(status=status.HTTP_404_NOT_FOUND)
        receipt.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
@permission_classes([IsAuthenticated])
class ItemViewSet(viewsets.ViewSet):
    def list(self, request, pk=None):
        queryset = Item.objects.all()
        items = []
        for item in queryset:
            if item.receipt == pk:
                items.append(item)
        serializer = ItemSerializer(items, many=True)
        return Response(serializer.data)

    def create(self, request):
        serializer = ItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, pk=None):
        queryset = Item.objects.all()
        item = get_object_or_404(queryset, pk=pk)
        serializer = ItemSerializer(item)
        return Response(serializer.data)
    
    def update(self, request, pk=None):
        item = Item.objects.get(pk=pk)
        serializer = ItemSerializer(item, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        item = Item.objects.get(pk=pk)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)