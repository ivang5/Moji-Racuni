from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('account.api.urls')),
    path('api/', include('company.api.urls')),
    path('api/', include('receipt.api.urls'))
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
