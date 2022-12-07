from email.policy import default
from django.db import models

from account.models import User
from company.models import CompanyUnit

class Receipt(models.Model):
    date = models.DateTimeField()
    link = models.TextField()
    user = models.ForeignKey(User, db_column='user', on_delete=models.CASCADE, null=False)
    totalPrice = models.DecimalField(max_digits=9, decimal_places=2)
    totalVat = models.DecimalField(max_digits=9, decimal_places=2)
    companyUnit = models.ForeignKey(CompanyUnit, db_column='companyUnit', on_delete=models.SET_NULL, null=True)
    
class Item(models.Model):
    class MeasurementUnit(models.TextChoices):
        KOM = "KOM"
        KUT = "KUT"
        KG = "KG"
        L = "L"
    class VatType(models.IntegerChoices):
        OPSTI = 20
        POSEBNI = 10
        BEZ = 0
        
    measurementUnit = models.CharField(
        max_length=3,
        choices=MeasurementUnit.choices,
        default=MeasurementUnit.KOM
    )
    vatType = models.IntegerField(
        choices=VatType.choices,
        default=VatType.OPSTI
    )
    name = models.TextField()
    price = models.DecimalField(max_digits=9, decimal_places=2)
    quantity = models.DecimalField(max_digits=9, decimal_places=3)
    receipt = models.ForeignKey(Receipt, db_column='receipt', on_delete=models.CASCADE, null=False)
