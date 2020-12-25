from django.db import models

# Create your models here.
class queue_config(models.Model):
    #id = models.ForeignKey('queue_config_id', related_name='queue', on_delete=models.CASCADE)
    STATE_CHOICES = (
        (0, 'Автоматически'),
        (1, 'Вручную')
    )
    STATE_CHOICES2 = (
        (0, 'Стандартный'),
        (1, 'Через сканирование')
    )
    not_kpp = models.IntegerField(verbose_name=u"Работа логики", choices=STATE_CHOICES, default='0')
    area_suppliers = models.IntegerField(verbose_name=u"Управлять через сканирование штрих кода", choices=STATE_CHOICES2, default='0')

    class Meta:
        verbose_name = u'Настройки'
        verbose_name_plural = u'Настройки'
