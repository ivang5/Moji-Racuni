from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('account.api.urls')),
    path('api/', include('company.api.urls')),
    path('api/', include('receipt.api.urls'))
]
