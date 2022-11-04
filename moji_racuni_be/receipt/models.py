from email.policy import default
from django.db import models

from account.models import User
from company.models import CompanyUnit

class Receipt(models.Model):
    date = models.DateField()
    link = models.TextField()
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=False)
    companyUnit = models.ForeignKey(CompanyUnit, on_delete=models.SET_NULL, null=True)
    
class Item(models.Model):
    class MeasurementUnit(models.TextChoices):
        KOM = "KOM"
        KUT = "KUT"
        KG = "KG"
        L = "L"
        
    measurementUnit = models.CharField(
        max_length=3,
        choices=MeasurementUnit.choices,
        default=MeasurementUnit.KOM
    )
    name = models.TextField()
    price = models.DecimalField(max_digits=9, decimal_places=2)
    quantity = models.DecimalField(max_digits=9, decimal_places=3)
    receipt = models.ForeignKey(Receipt, on_delete=models.CASCADE, null=False)