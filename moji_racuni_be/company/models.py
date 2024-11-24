from django.db import models
from django.core.validators import MaxValueValidator

from account.models import User

class CompanyType(models.Model):
    name = models.CharField(max_length=150)
    description = models.TextField()
    user = models.ForeignKey(User, db_column='user', on_delete=models.CASCADE, null=False)

class Company(models.Model):
    tin = models.PositiveIntegerField(primary_key=True, validators=[MaxValueValidator(999999999)])
    name = models.CharField(max_length=150)
    type = models.ManyToManyField(CompanyType, null=True)
    image = models.ImageField(upload_to='images', null=True)
    
class CompanyUnit(models.Model):
    name = models.CharField(max_length=150)
    address = models.CharField(max_length=70)
    place = models.CharField(max_length=60)
    municipality = models.CharField(max_length=60)
    category = models.CharField(max_length=50)
    company = models.ForeignKey(Company, db_column='company', on_delete=models.SET_NULL, null=True)