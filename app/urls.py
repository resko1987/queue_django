"""app URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.1/topics/http/urls/
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
from django.urls import include, path
from django.urls import re_path
from django.conf.urls import url
from django.views.generic import RedirectView
#from django.views.generic import TemplateView
from queue_suppliers.views import suppliers
from queue_suppliers.views import index
from queue_suppliers.views import post
from queue_suppliers.views import print_barcodes
#from queue_config.views import register_queue
#from django.http import HttpResponse


favicon_view = RedirectView.as_view(url='/static/favicon.ico', permanent=True)

urlpatterns = [
    #url(r'^favicon\.ico$', RedirectView.as_view(url='/static/images/favicon.ico'), name='favicon'),
    re_path(r'^favicon\.ico$', favicon_view),
    path(r'admin/', admin.site.urls),
    url(r'post/', post),
    url(r'suppliers/', suppliers),
    url(r'print_barcodes/', print_barcodes),
    url(r'^$', index),
]
# TemplateView.as_view(template_name="suppliers.html")


# ������ 34
# �������� 49  10:00




