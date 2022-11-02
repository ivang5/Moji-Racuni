from dataclasses import field
from pyexpat import model
from rest_framework.serializers import ModelSerializer
from receipt.models import Receipt
from receipt.models import Item

class ReceiptSerializer(ModelSerializer):
    class Meta:
        model = Receipt
        fields = '__all__'
        
class ItemSerializer(ModelSerializer):
    class Meta:
        model = Item
        fields = '__all__'