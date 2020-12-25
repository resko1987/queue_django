# -*- coding: utf-8 -*-
from django.shortcuts import render
from django.http import JsonResponse
from django.http import HttpResponse
from django.core import serializers
from django.db import connection, transaction
from datetime import datetime, timedelta
import random
import json

from pip._internal.operations.install.wheel import req_error_context

from queue_suppliers.models import queue_suppliers
from queue_config.models import queue_config
from gates.models import gates


# Очередь поставщиков
def index(request):
    # View code here...
    rand_number = str(random.randint(1, 9999))
    now = datetime.now()
    now_year = now.year

    return render(request, 'queue.html', {
        'title': 'Очередь поставщиков',
        'rand': rand_number,
        'now_year': now_year})

# Зона приемки
def suppliers(request):
    # View code here...
    return render(request, 'suppliers.html', {'title': 'Зона приемки'})

# Печать штрихкодов
def print_barcodes(request):
    return render(request, 'print_barcodes.html', {'title': 'Печать штрихкодов'})

# Получение данных из 1С
def register_queue(request):
    # View code here...
    data = {'error': '0', 'str': 'Выполнено успешно', 'title': 'register_queue'}
    # ответ в формате json
    return JsonResponse(json.dumps(data), safe=False)

# Functions
# Обновить дату приезда
def update_date_use_gate(queue_suppliers_elm_id):
    print('update_date_use_gate' + str(queue_suppliers_elm_id))
    try:
        cursor = connection.cursor()
        cursor.execute("UPDATE queue_suppliers_queue_suppliers SET date_use_gate = now() "
                       "WHERE id = %s ", [int(queue_suppliers_elm_id)])
        transaction.atomic()
        return 0
    except Exception:
        return 1

# Обновить дату освобождения ворот
def update_date_free_gate(queue_suppliers_elm_id):
    try:
        cursor = connection.cursor()
        cursor.execute(
            "UPDATE queue_suppliers_queue_suppliers  "
            "SET date_free_gate = now() WHERE id = %s ",
                       [queue_suppliers_elm_id]
                       )
        transaction.atomic()
        return 0
    except Exception:
        return 1

# Сохранить данные по воротам для табло
def set_db_gates_gates(gate_id, status, supplername, queue_num, queue_id):
    print('set_db_gates_gates')
    try:
        obj = gates.objects.get(pk=gate_id)
        obj.status = status
        obj.supplername = supplername
        obj.queue_num = queue_num
        obj.queue_id = queue_id
        obj.save()
        return 0
    except Exception:
        return 1

# Обновим данные по заданию
def set_db_queue_suppliers(elm_id, status, avto_number):
    print('set_db_queue_suppliers')
    try:
        obj = queue_suppliers.objects.get(pk=elm_id)
        obj.status = status
        if(len(avto_number) > 0):
            obj.queue_num = avto_number
        obj.save()

        # Если приехал поставщик фиксируем дату приезда
        if(status == 1):
            if (update_date_use_gate(elm_id) == 0):
                return 0
            else:
                return 2
        # Если освобождает ворота то фиксируем дату освобождения
        if (status == 4):
            if (update_date_free_gate(elm_id) == 0):
                return 0
            else:
                return 2

        return 0
    except Exception:
        return 1

# Вспомогательная функция, для получения данных
def dictfetchall(cursor):
    "Returns all rows from a cursor as a dict"
    desc = cursor.description
    return [
        dict(zip([col[0] for col in desc], row))
        for row in cursor.fetchall()
    ]

# Отчистить старые данные ворот
def clear_old_suppliers():
    try:
        cursor = connection.cursor()
        cursor.execute(
           "select g.*, "
           "(select qq.id from queue_suppliers_queue_suppliers qq "
           "where qq.id=g.queue_id and qq.created_date<current_date) as queue_suppliers_id "
           "from gates_gates g",
                      []
                      )
        edata = dictfetchall(cursor)

        for elm in edata:
            if(elm['queue_suppliers_id'] is not None):
                set_db_gates_gates(elm['id'], 0, '', '', 0)

        return 0
    except Exception:
        return 1


def post(request):

    # Получение данных из 1С
    data = {'error': '1', 'str': 'Нет данных'}
    if request.method == 'POST':
        try:
            jdata = json.loads(request.body)
        except:
            data = {'error': '1', 'str': 'Не валидный json'}


        for item in jdata['data']:
            obj = queue_suppliers()
            obj.externalcode = item['externalcode']
            obj.objname = item['objname']
            obj.ndow = item['ndow']
            obj.timeincome = item['timeincome']
            obj.save()

        data = {'error': '0', 'str': 'Выполнено успешно', 'title': 'register_queue'}

    # Формируем ответ и фиксируем выгрузку
    if 'timeofarriva' in request.GET:
        today = datetime.now() + timedelta(minutes=600)
        objs = queue_suppliers.objects.all().filter(created_date__gte=today).filter(status__gte=4).filter(export_1c__lte=0)

        edata = []
        for elm in objs:
            tdate = str(elm.date_use_gate)[0:10].split('-')

            row = {'externalcode': str(elm.externalcode), 'timeincome': str(elm.date_use_gate)[11:19], 'date': tdate[2] + '.' + tdate[1] + '.' + tdate[0]}
            edata.append(row)
            o = queue_suppliers.objects.get(pk=elm.id)
            o.export_1c = 1
            #o.save()

        data = {'error': '0', 'str': 'Выполнено успешно', 'data': edata }
        # [{'externalcode': 10597, 'timeincome': '00:10:00', 'date': '22.10.2020'}]

    # Список поставщиков которые должны приехать сегодня
    if 'get_queue_suppliers_today' in request.GET:
        try:
            today = datetime.now() + timedelta(minutes=600)
            #print('today: ' + today.strftime("%d-%m-%Y %H:%M"))
            #sql = "select * from queue_suppliers_queue_suppliers q where q.created_date=current_date "
            findstr = ''
            if ('queue_find' in request.GET):
                findstr = request.GET['queue_find']

            if(len(findstr) > 0):
                edata = queue_suppliers.objects.filter(created_date__gte=today).filter(objname__icontains=findstr).order_by('timeincome')
            else:
                edata = queue_suppliers.objects.filter(created_date__gte=today).order_by('timeincome')

            #sql += "and q.objname LIKE '%Дан%' "
            #sql += "order by q.timeincome ASC "
            #print(sql)

            #edata = queue_suppliers.objects.raw(sql)
            data = serializers.serialize('json', edata)
            print(edata)
        except Exception:
            data = {'error': '1', 'str': 'Ошибка в запросе'}
            return JsonResponse(data, safe=False)

        return HttpResponse(data, content_type='application/json')
        #data = {'error': '0', 'str': 'Выполнено успешно', 'data': [{'externalcode': 10597, 'timeincome': '00:10:00', 'date': '22.10.2020'}]}

    # Получить список имеющийхс поставщиков
    if 'get_all_suppliers' in request.GET:
        print('get_all_suppliers')
        try:
            edata = queue_suppliers.objects.all().distinct('externalcode', 'objname').order_by('objname')
            # raw("select DISTINCT q.externalcode, q.objname "
            #                                     "from queue_suppliers_queue_suppliers q "
            #                                     "order by q.objname asc")
            data = serializers.serialize('json', edata)
        except Exception:
            data = {'error': '1', 'str': 'Ошибка в запросе'}
            return JsonResponse(data, safe=False)

        return HttpResponse(data, content_type='application/json')

    # Добавление поставщика
    if 'add_supplier' in request.GET:
        if len(request.GET['timeincome']) > 0:
            try:
                obj = queue_suppliers()
                obj.externalcode = request.GET['suppliercode']
                obj.objname = request.GET['suppliername']
                obj.timeincome = request.GET['timeincome'] + ':00'
                obj.save()
            except Exception:
                data = {'error': '1', 'str': 'Ошибка в запросе'}
            data = {'request': '1'}
        else:
            data = {'error': '1', 'str': 'Не указано время!'}

    # Получение настроек
    if 'get_config' in request.GET:
        print('get_config')
        try:
            edata = queue_config.objects.all()
            #print(edata)
            data = serializers.serialize('json', edata)
            return HttpResponse(data, content_type='application/json')
        except Exception:
            data = {'error': '1', 'str': 'Ошибка в запросе'}

    # Установка настроек
    if 'set_config' in request.GET:
        try:
            obj = queue_config.objects.get(pk=1)
            obj.not_kpp = request.GET['not_kpp']
            obj.area_suppliers = request.GET['area_suppliers']
            obj.save()
            data = {'error': '0', 'str': 'Успешно сохранено'}
        except Exception:
            data = {'error': '1', 'str': 'Ошибка в запросе'}

    # Получение данных по воротам
    if 'get_gates' in request.GET:

        clear_old_suppliers()

        try:
            edata = gates.objects.all().order_by('gatename')
            data = serializers.serialize('json', edata)
            return HttpResponse(data, content_type='application/json')
        except Exception:
            data = {'error': '1', 'str': 'Ошибка в запросе'}

    # Добавление ворот
    if 'add_gates' in request.GET:
        try:
            objs_count = gates.objects.count()
            objs_count = objs_count + 1;
            obj = gates()
            obj.gatename = 'Ворота ' + str(objs_count)
            obj.status = 0
            obj.supplername = ''
            obj.showdisplay = 1
            obj.save()
            data = {'error': '0', 'str': 'Успешно выполнено'}
        except Exception:
            data = {'error': '1', 'str': 'Ошибка в запросе'}

    # Быстрое обновление данных в поле
    if 'fast_update' in request.GET:
        try:
            cursor = connection.cursor()
            cursor.execute("UPDATE " + request.GET['attr_table'] + " SET " + request.GET['attr_row'] + " = %s WHERE id = " + request.GET['pk'], [request.GET['val']])
            transaction.atomic()
            data = {'error': '0', 'str': 'Успешно выполнено'}
        except Exception:
            data = {'error': '1', 'str': 'Ошибка в запросе'}

    if 'post_next_step' in request.GET:
        try:
            elm_id = request.GET['elm_id']
            supplername = request.GET['objname']
            avto_number = request.GET['avto_number']
            elm_status = request.GET['elm_status']
            setGatesSelect = int(request.GET['setGatesSelect'])

            # Если не передали номер ворот то автоматически назначим
            gate_id = 0
            if(setGatesSelect == 0):
                # получим первые свободдные ворота
                gData = gates.objects.all().order_by('priority')
                for elm in gData:
                    print(elm.id)
                    if(len(elm.queue_num) == 0):
                        gate_id = elm.id
                        break
            if(setGatesSelect > 0):
                gate_id = setGatesSelect

            # Статус
            new_status = int(elm_status) + 1

            process = set_db_queue_suppliers(elm_id, new_status, avto_number)

            # Если есть свободные ворота то сразу ставим на ворота машину
            if(process == 0 and (new_status == 1 or new_status == 2) and int(gate_id) > 0):
                if(set_db_gates_gates(gate_id, 2, supplername, avto_number, elm_id) == 0):
                    process = set_db_queue_suppliers(elm_id, 2, avto_number)
                else:
                    process = 3

            #print('process end: ' + str(process))
            if(process==0):
                data = {'error': '0', 'str': 'Успешно выполнено'}
            if(process==2):
                data = {'error': '1', 'str': 'Ошибка сохранения даты'}
            if(process==1):
                data = {'error': '1', 'str': 'Ошибка обновления данных'}
            if (process == 3):
                data = {'error': '1', 'str': 'Ошибка, данные по воротам не обновлены'}
        except Exception:
            data = {'error': '1', 'str': 'Ошибка в запросе'}

    if 'post_step_set' in request.GET:
        try:
            elm_id = request.GET['elm_id']
            elm_status = int(request.GET['elm_status'])

            gate_id = 0
            # получим первые свободдные ворота
            gData = gates.objects.all().order_by('priority')
            for elm in gData:
                print(str(elm.queue_id) + ' == ' + str(elm_id))
                if (int(elm.queue_id) == int(elm_id)):
                    gate_id = elm.id
                    break

            process = set_db_queue_suppliers(elm_id, elm_status, '')
            if (process == 0 and (elm_status == 4 or elm_status == 0)):

                if (set_db_gates_gates(gate_id, 0, '', '', 0) > 0):
                    process = 3


            if(process==0):
                data = {'error': '0', 'str': 'Успешно выполнено'}
            if(process==2):
                data = {'error': '1', 'str': 'Ошибка сохранения даты'}
            if(process==1):
                data = {'error': '1', 'str': 'Ошибка обновления данных'}
            if (process == 3):
                data = {'error': '1', 'str': 'Ошибка, данные по воротам не обновлены'}
        except Exception:
            data = {'error': '1', 'str': 'Ошибка в запросе'}

    return JsonResponse(data, safe=False)


def display_get_gates(request):
    try:
        cursor = connection.cursor()
        cursor.execute(
           "select "
           "g.status as STATUS, "
           "g.message as MESSAGE, "
           "g.gatename as NAMEZONE_REAL, "
           "g.queue_id as GATE_QUEUE_ID, "
           "g.queue_num as QUEUE_NUM, "
           "g.id as IDRECEIVINGZONE, "
           "'В-' || substring(g.gatename, char_length(g.gatename) ) as NAMEZONE, "
           "'' as ADVENT, "
           "'' as SHOPID, "
           "g.supplername as SUPPLER_NAME "
           "from gates_gates g",
                      []
                      )
        edata = dictfetchall(cursor)

        # Приводим данные в нужный вид
        for elm in edata:
            if (len(elm['message']) == 0):
                elm['message'] = None
            if (elm['gate_queue_id'] == 0):
                elm['gate_queue_id'] = None
            if(len(elm['queue_num']) == 0):
                elm['queue_num'] = '—'
            if (len(elm['advent']) == 0):
                elm['advent'] = None
            elm['shopid'] = 0
            if (len(elm['suppler_name']) == 0):
                elm['suppler_name'] = None

        return JsonResponse(edata, safe=False)
    except Exception:
        data = {'error': '1', 'str': 'Ошибка в запросе'}
        return JsonResponse(data, safe=False)