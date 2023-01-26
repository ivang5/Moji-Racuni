from random import choices
from weakref import proxy
from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", 'Admin'
        REGULAR = "REGULAR", 'Regular'
        
    base_role = Role.REGULAR
    
    role = models.CharField(max_length=50, choices=Role.choices)
    
    REQUIRED_FIELDS=["first_name", "last_name", "email"]
    
    def save(self, *args, **kwargs):
        if not self.pk:
            if self.is_superuser:
                self.role = User.Role.ADMIN
            else:
                self.role = self.base_role
        return super().save(*args, **kwargs)
        
class Admin(User):
    
    base_role = User.Role.ADMIN
    
    class Meta:
        proxy = True
