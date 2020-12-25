from django.contrib import admin
from .models import queue_config

# Register your models here.
class queue_config_admin(admin.ModelAdmin):
    empty_value_display = '-empty-'
    pass

# Register your models here.
admin.site.register(queue_config, queue_config_admin)