from django.contrib import admin
from .models import Receipt, Item, Report

# Register your models here.

models = [Receipt, Item, Report]
admin.site.register(models)
