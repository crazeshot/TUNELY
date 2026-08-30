from django.contrib import admin
from django.urls import include, path

from api.views import api_root, favicon

urlpatterns = [
    path('', api_root, name='home'),
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('favicon.ico', favicon),
]
