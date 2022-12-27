from dataclasses import field
from pyexpat import model
from rest_framework.serializers import ModelSerializer
from receipt.models import Receipt
from receipt.models import Item
from receipt.models import Report

class ReceiptSerializer(ModelSerializer):
    class Meta:
        model = Receipt
        fields = '__all__'
        
class ItemSerializer(ModelSerializer):
    class Meta:
        model = Item
        fields = '__all__'
        
class ReportSerializer(ModelSerializer):
    class Meta:
        model = Report
        fields = '__all__'