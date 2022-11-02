from django.contrib import admin
from .models import Receipt, Item

# Register your models here.

models = [Receipt, Item]
admin.site.register(models)