from django.contrib import admin
from .models import queue_suppliers

# Register your models here.
class queue_suppliers_admin(admin.ModelAdmin):
    empty_value_display = '-empty-'
    pass

# Register your models here.
admin.site.register(queue_suppliers, queue_suppliers_admin)