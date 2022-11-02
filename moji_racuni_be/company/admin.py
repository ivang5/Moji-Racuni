from django.contrib import admin
from .models import Company, CompanyUnit, CompanyType

# Register your models here.

models = [Company, CompanyUnit, CompanyType]
admin.site.register(models)