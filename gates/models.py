from django.db import models

# Create your models here.
class gates(models.Model):
    gatename = models.CharField(max_length=255)
    status = models.IntegerField(default=0)
    supplername = models.CharField(max_length=80)
    queue_id = models.IntegerField(default=0)
    queue_num = models.CharField(max_length=10)
    message = models.CharField(max_length=255, default='')
    showdisplay = models.IntegerField(default=0)
    donotautomatic = models.IntegerField(default=0)
    priority = models.IntegerField(default=10)

    def __str__(self):
        return self.gatename

    class Meta:
        verbose_name = u'Ворота'
        verbose_name_plural = u'Ворота'