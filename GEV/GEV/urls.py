"""
URL configuration for GEV project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include, re_path
from drf_yasg import openapi
from drf_yasg.views import get_schema_view

# estructura de información para la documentación
schema_view = get_schema_view(
    openapi.Info(
        title = 'Mi Casa Eficiente API',
        default_version = 'v1',
        description = 'API para uso de Mi casa Eficiente',
    ),
    public = True,
)


urlpatterns = [
    path("admin/", admin.site.urls),
    path("mi_casa_eficiente/", include("apps.mi_casa_eficiente.api.urls")),
    re_path(r'^api/v1/swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    re_path(r'^api/v1/swagger/$', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    re_path(r'^api/v1/redoc/$', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]
