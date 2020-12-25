from django.db import models

# Create your models here.
class queue_suppliers(models.Model):
    externalcode = models.IntegerField()
    objname = models.CharField(max_length=255)
    ndow = models.IntegerField(default=0)
    timeincome = models.TimeField()
    created_date = models.DateField(auto_now=True) #  auto_now_add=True
    status = models.IntegerField(default=0)
    date_use_gate = models.DateTimeField(null=True, blank=True)
    date_free_gate = models.DateTimeField(null=True, blank=True)
    queue_num = models.CharField(max_length=10)
    late = models.IntegerField(default=0)
    message = models.CharField(max_length=255)
    export_1c = models.IntegerField(default=0)

    def __str__(self):
        return self.objname

    class Meta:
        verbose_name = u'Очередь'
        verbose_name_plural = u'Очередь'