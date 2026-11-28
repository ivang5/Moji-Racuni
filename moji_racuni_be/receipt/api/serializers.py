from rest_framework import serializers

from receipt.models import Item, Receipt, Report


class ReceiptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Receipt
        fields = ['id', 'date', 'link', 'user', 'totalPrice', 'totalVat', 'companyUnit']
        #* Vlasnik je uvek prijavljeni korisnik (postavlja ga view)
        read_only_fields = ['user']


class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = ['id', 'measurementUnit', 'vatType', 'name', 'price', 'quantity', 'receipt']


class ReportSerializer(serializers.ModelSerializer):
    """Prikaz prijave."""

    class Meta:
        model = Report
        fields = ['id', 'date', 'request', 'response', 'closed', 'seen', 'receipt', 'user']
        read_only_fields = fields


class ReportCreateSerializer(serializers.ModelSerializer):
    """
    Nova prijava (REGULAR): klijent zadaje samo račun i tekst prijave; račun mora biti njegov.
    Korisnika i datum postavlja view.
    """

    receipt = serializers.PrimaryKeyRelatedField(queryset=Receipt.objects.none())

    class Meta:
        model = Report
        fields = ['receipt', 'request']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        #* Tuđi račun se ponaša kao nepostojeći (400 "object does not exist")
        self.fields['receipt'].queryset = Receipt.objects.filter(user=self.context['request'].user)


class ReportResponseSerializer(serializers.ModelSerializer):
    """Odgovor administratora na prijavu."""

    response = serializers.CharField()

    class Meta:
        model = Report
        fields = ['response', 'closed']
