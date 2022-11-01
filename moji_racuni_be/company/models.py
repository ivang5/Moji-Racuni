from django.db import models
from django.core.validators import MaxValueValidator

from account.models import User

class CompanyType(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=False)

class Company(models.Model):
    tin = models.PositiveIntegerField(primary_key=True, validators=[MaxValueValidator(999999999)])
    name = models.CharField(max_length=80)
    type = models.ForeignKey(CompanyType, on_delete=models.SET_NULL, null=True)
    
class CompanyUnit(models.Model):
    name = models.CharField(max_length=80)
    address = models.CharField(max_length=50)
    place = models.CharField(max_length=50)
    municipality = models.CharField(max_length=50)
    category = models.CharField(max_length=50)
    company = models.ForeignKey(Company, on_delete=models.SET_NULL, null=True)