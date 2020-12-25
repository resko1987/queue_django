/**
 * Created by viktor on 16.10.20.
 */

/*
 * Глобальные переменные
 */
var queue_elms = [];
var suppliers = [];
var gates = [];

// Настройки
var not_kpp = 0;
var area_suppliers = 0;
var queue_find = '';

// Объект для работы
var queue = undefined;

// Класс объекта
class Queue {

    constructor(elm_id) {
        queue = this;
        this._elm_id = elm_id;
        this._elm = document.getElementById(elm_id);
        this.cprint("Init Queue");
        queue.get_config();
    }

    /**
     * Функция обработки ответа
     * Адрес запроса
     * Параметры запроса
     * @param func
     * @param url
     * @param params
     */
    jpost(func, url, params) {
        $.ajax({
            url: url,
            dataType: 'json',
            async: true,
            data: params,
            success: function (data) {
                if (queue.isJsonString(data)) {
                    func(JSON.parse(data));
                } else {
                    func(data);
                }
            }
        });
    }

    init_table() {
        var h = '' +
            '<div class="table-responsive"><table class="table table-sm table-bordered table-hover table-striped queue_table w-100 mb-3" border="0">' +
            '<thead class="text-center">' +
            '<tr class="listDay"><th>№</th>' +
            '<th class="text-center">Время</th>' +
            '<th class="text-center pl-1 pr-1">Статус</th>' +
            '<th>Поставщик</th>' +
            //'<th>Ворота</th>' +
            '<th>Время приезда</th>' +
            '<th>Время освобождения</th>' +
            '<th>' +
            '<div class="custom-control custom-checkbox ml-1">' +
            '<input type="checkbox" class="custom-control-input check_all" id="check_all">' +
            '<label class="custom-control-label" for="check_all"></label>' +
            '</div></th>' +
            '</tr>' +
            '</thead>' +
            '<tbody class="queue_table_body">' +
            '</tbody>' +
            '</table></div>';
        queue.append(h);

        queue.get_table_data();
        setInterval(function () {
            queue.get_table_data();
        }, 10000);
        queue.init_zone_status();
        queue.init_search_objname();

    }

    // Получить данные по таблице
    get_table_data() {
        queue_find = $(".queue_find_text").val();
        queue.jpost(function (data) {
            queue_elms = [];
            if (data.length > 0) {
                for (var i = 0; i < data.length; i++) {
                    queue_elms.push({'pk': data[i]['pk'], 'fields': data[i]['fields']});

                }
            }
            queue.html_queue(queue_elms);
        }, '/post/?get_queue_suppliers_today=1&queue_find=' + queue_find, {});
    }

    // Получить всех имеющийся поставщиков системы
    get_all_suppliers() {
        queue.jpost(function (data) {
            suppliers = [];
            $(".suppliers").html("");
            if (data.length > 0) {
                for (var i = 0; i < data.length; i++) {
                    suppliers.push({
                        'externalcode': data[i]['fields']['externalcode'],
                        'objname': data[i]['fields']['objname']
                    });
                    $(".suppliers").append('<option value="' + data[i]['fields']['externalcode'] + '">' + data[i]['fields']['objname'] + '</option>');
                }
            }
        }, '/post/?get_all_suppliers=1', {});
    }

    // Для теста добавления материала в блок
    html_queue(data) {
        $(queue._elm).find(".queue_table_body").html("");
        var a = 1;


        for (var i = 0; i < data.length; i++) {
            var h = "";
            var timeincome = (data[i]['fields']['timeincome'] != null) ? data[i]['fields']['timeincome'] : '';
            var status = (data[i]['fields']['status'] != null) ? data[i]['fields']['status'] : '';
            var status_btn = "";
            var date_use_gate = (data[i]['fields']['date_use_gate'] != null) ? data[i]['fields']['date_use_gate'] : '';
            var date_free_gate = (data[i]['fields']['date_free_gate'] != null) ? data[i]['fields']['date_free_gate'] : '';

            var date_use_gate_str = '';
            if (date_use_gate.length > 0) {
                var date_use_gate = new Date(date_use_gate);
                date_use_gate_str = date_use_gate.getHours() + ':' + date_use_gate.getMinutes();
            }
            var date_free_gate_str = '';
            if (date_free_gate.length > 0) {
                console.log('date_free_gate: ' + date_free_gate);
                var date_free_gate = new Date(date_free_gate);
                date_free_gate_str = date_free_gate.getHours() + ':' + date_free_gate.getMinutes();
            }

            switch (status) {
                case 0:
                    status_btn = '<a href="javascript:void(0)" class="btn btn-info btn_step_next">Ожидается...</a>';
                    break;
                case 1:
                    status_btn = '<a href="javascript:void(0)" class="btn btn-primary btn_step_next">Прибыл</a>';
                    break;
                case 2:
                    status_btn = '<a href="javascript:void(0)" class="btn btn-success btn_step_next">Занял ворота</a>';
                    break;
                case 3:
                    status_btn = '<a href="javascript:void(0)" class="btn btn-info btn_step_next">Ожидается...</a>';
                    break;
                case 4:
                    status_btn = '<a href="javascript:void(0)" class="btn btn-light">Освободил ворота</a>';
                    break;
                default:
                    status_btn = '<a href="javascript:void(0)" class="btn btn-info btn_step_next">Ожидается...</a>';
                    break;
            }

            h = '<tr pk="' + data[i]['pk'] + '" obj_i="' + i + '" extcode="' + data[i]['fields']['externalcode'] + '" status="' + status + '">' +
                '<td class="text-center" style="vertical-align: middle;">' + a + '</td>' +
                '<td class="text-center" style="vertical-align: middle;">' + timeincome + '</td>' +
                '<td class="text-center pl-1 pr-1" style="vertical-align: middle;" status="' + status + '">' + status_btn + '</td>' +
                '<td class="objname" style="vertical-align: middle;">' + data[i]['fields']['objname'] + '</td>' +
                //'<td class="gate" style="vertical-align: middle;">&nbsp;</td>' +
                '<td class="text-center" style="vertical-align: middle;">' + date_use_gate_str + '</td>' +
                '<td class="text-center" style="vertical-align: middle;">' + date_free_gate_str + '</td>' +
                '<td class="text-center" style="vertical-align: middle;">' +
                '<div class="custom-control custom-checkbox ml-1">' +
                '<input type="checkbox" class="custom-control-input checkbox_elm" id="' + data[i]['pk'] + '">' +
                '<label class="custom-control-label" for="' + data[i]['pk'] + '"></label>' +
                '</div>' +
                '</td></tr>';
            a++;
            $(queue._elm).find(".queue_table_body").append(h);
        }
        setTimeout(function () {
            queue.check_all();
            queue.btn_step_next_click();
            queue.btn_add_supplier_click();
            queue.btn_print_articls();
        }, 300);

    }

    init_search_objname() {
        $(".queue_find_text").unbind('keyup').keyup(function () {
            queue_find = $(this).val();
            queue.get_table_data();
        });
    }

    // Отобразить в консоли
    cprint(v) {
        console.log(v);
    }

    // Отобразить HTML
    html(v) {
        queue._elm.innerHTML = v;
    }

    // Добавить HTML
    append(v) {
        var h = queue._elm.innerHTML;
        queue._elm.innerHTML = h + v;
    }

    // кнопка смена сатуса (ЕЩЕ НЕ ДЕЛАЛ)
    btn_step_next_click() {
        $(".btn_step_next").unbind("click").click(function () {

            if(queue.initAlertAreaSuppliers()) {

                $(".modal-footer").find(".btn_save").hide();
                var elm_id = $(this).closest("tr").attr("pk");
                var obj_i = $(this).closest("tr").attr("obj_i");
                var elm_status = $(this).closest("tr").attr("status");
                var elm_extcode = $(this).closest("tr").attr("extcode");
                $('#modal').find(".modal-body").html("");
                $('#modal').find(".modal-title").html("Выберите действие");
                $('#modal').modal("show");
                var setGatesSelectDisable = '';
                if (not_kpp == 0) {
                    setGatesSelectDisable = 'disabled="disabled"';
                }

                // Статус = 0
                if (Number(elm_status) == 0) {
                    if ($(".modal-footer").find(".post_next_step").length == 0) {
                        $(".modal-footer").append('<a href="javascript:void(0)" class="btn btn-primary post_next_step">Прибыл / Поставить в очередь</a>');
                    }
                    var h = '<div class="mb-2"><span>Поставщик:</span> <span class="step_next_title">' + queue_elms[obj_i]['fields']['objname'] + '</span></div>' +
                        '<div class="mb-3 clearfix"><input type="text" id="auto_number" value="" class="form-control avto_number w-auto float-left" placeholder="Номер машины" /> <select class="form-control w-50 float-right setGatesSelect" ' + setGatesSelectDisable + ' ' + not_kpp + '></select></div>' +
                        '<div class="clearfix" style="display: none;"><select class="form-control w-100 setSupplerSelect" multiple="multiple" data-placeholder="Объеденить с номером очереди"></select></div>';
                }

                // Статус > 0
                if (Number(elm_status) > 0) {
                    $(".modal-footer").find(".post_next_step").remove();
                    var h = '<div class="mb-2">' +
                        '<div class="row text-center">' +
                        '<div class="col-6">' +
                        '<a href="javascript:void(0)" status="0" class="btn btn-info btn_step_set">Ожидается</a>' +
                        '</div>' +
                        '<div class="col-6">' +
                        '<a href="javascript:void(0)" status="4" class="btn btn-light btn_step_set">Освободить ворота</a>' +
                        '</div>' +
                        '</div>';
                }

                h += '<div class="result"></div>';

                $('#modal').find(".modal-body").html(h);
                queue.focus(".auto_number");
                queue.init_supluers_select();

                queue.init_gates();
                // Следующий шаг отправка данных
                if (!!$(".post_next_step")) {
                    $(".post_next_step").unbind("click").click(function () {
                        var objname = queue_elms[obj_i]['fields']['objname'];
                        var avto_number = $(".avto_number").val();
                        var setGatesSelect = $(".setGatesSelect").val();
                        // alert("elm_id: " + elm_id
                        //     + " objname: " + objname
                        //     + " avto_number: " + avto_number
                        //     + " setGatesSelect: " + setGatesSelect
                        //     + " elm_status: " + elm_status
                        //     + " elm_extcode: " + elm_extcode);
                        queue.jpost(
                            function (data) {
                                if (data['error'] == '0') {
                                    $('#modal').modal("hide");
                                    queue.get_table_data();
                                    queue.init_gates();
                                } else {
                                    $('.result').html(data['str']);
                                }
                            },
                            '/post/?post_next_step=1',
                            {
                                'elm_id': elm_id,
                                'objname': objname,
                                'avto_number': avto_number,
                                'setGatesSelect': setGatesSelect,
                                'elm_status': elm_status,
                                'elm_extcode': elm_extcode
                            }
                        );
                    });
                }

                // Назначить статус
                if (!!$(".btn_step_set")) {
                    $(".btn_step_set").unbind("click").click(function () {
                        var elm_status = $(this).attr("status");
                        queue.jpost(
                            function (data) {
                                if (data['error'] == '0') {
                                    $('#modal').modal("hide");
                                    queue.get_table_data();
                                    queue.init_gates();
                                } else {
                                    $('.result').html(data['str']);
                                }
                            },
                            '/post/?post_step_set=1',
                            {
                                'elm_id': elm_id,
                                'elm_status': elm_status
                            }
                        );
                    });
                }
            }
        });

    }

    // Сообщение "Управлять через сканирование штрих кода"
    initAlertAreaSuppliers() {
        if (area_suppliers == 1) {
            alert("Управлять через сканирование штрих кода!");
            return false;
        }
        return true;
    }

    // кнопка добавлние нового поставщика
    btn_add_supplier_click() {
        $(".btn_add_supplier").unbind("click").click(function () {
            $(".modal-footer").find(".btn_save").show();
            $(".modal-footer").find(".post_next_step").remove();
            $('#modal').find(".modal-body").html("");
            $('#modal').find(".modal-title").html("Добавление поставщика");
            $('#modal').modal("show");
            $('#modal').find(".modal-body").append('<div>Поставщик</div>');
            $('#modal').find(".modal-body").append('<div><select class="custom-select suppliers"></select></div>');
            $('#modal').find(".modal-body").append('<div>Время приезда</div>');
            $('#modal').find(".modal-body").append('<div><div class="input-group">' +
                '<input type="text" class="form-control date time_piker" />' +
                '<span class="input-group-addon"><span class="glyphicon glyphicon-calendar"></span></span></div></div>');
            $('#modal').find(".modal-body").append('<div class="result"></div>');
            queue.get_all_suppliers();
            var dp = $('.time_piker').datetimepicker({locale: 'ru', format: 'H:m'})
                .on('dp.update dp.change dp.show dp.hide', function (e) {
                    var v = $(this).val();
                    var arr = []
                    for (var val of v.split(':')) {
                        if (val.length < 2) {
                            arr.push(0 + '' + val);
                        } else {
                            arr.push(val)
                        }
                    }
                    $(this).val(arr[0] + ':' + arr[1]);
                });

            $(".btn_save").unbind('click').click(function () {
                $('.result').html("");
                queue.jpost(
                    function (data) {
                        if (data['request'] == '1') {
                            $('#modal').modal("hide");
                            queue.get_table_data();
                        } else {
                            $('.result').html(data['str']);
                        }
                    },
                    '/post/?add_supplier=1',
                    {
                        'suppliercode': $(".suppliers").val(),
                        'suppliername': $(".suppliers option:selected").text(),
                        'timeincome': $('.time_piker').val()
                    }
                );
            });

        });
    }

    // Выделить все елементы для печати
    check_all() {
        $(queue._elm).find(".check_all").unbind("click").click(function () {
            if (!$(this).prop('checked')) {
                $(queue._elm).find(".checkbox_elm").each(function (e) {
                    if ($(this).prop('checked')) {
                        $(this).click();
                    }
                });
            } else {
                $(queue._elm).find(".checkbox_elm").each(function (e) {
                    if (!$(this).prop('checked')) {
                        $(this).click();
                    }
                });
            }
        });
    }

    // Распчатать штрихкоды
    btn_print_articls() {
        $(".btn_print_articls").unbind("click").click(function () {
            var elms_id = [];
            var elms_name = [];
            $(".checkbox_elm").each(function (e) {
                if ($(this).prop('checked')) {
                    elms_id.push($(this).attr('id'));
                    elms_name.push($(this).closest('tr').find(".objname").text());
                }
            });

            var url = '/print_barcodes/?c=' + queue.utf8_to_b64(elms_id.toString()) + '&n=' + queue.utf8_to_b64(elms_name.toString());
            //window.location.href = url;
            window.open(url);
        });
    }

    // Получим настройки
    get_config() {
        queue.jpost(
            function (data) {
                not_kpp = data[0]['fields']['not_kpp'];
                area_suppliers = data[0]['fields']['area_suppliers'];
                queue.append('<div class="configBlock">\n\
                                <div class="btn btn-primary float-left mr-3 configBlockOpen" title="Настройки">\n\
                                <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-chevron-left img_transform" fill="currentColor" xmlns="http://www.w3.org/2000/svg">\n\
                                    <path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>\n\
                                </svg>\n\
                                </div>\n\
                                <div class="float-left Configblock2" style="display: none;">\n\
                                    Настройки\n\
                                    <hr/>\n\
                                    <div class="float-left pt-1 pb-3 mr-3" style="text-align: center; display: block;">\n\
                                        <div class="configTitleText mb-2"><strong>Ворота</strong> <button type="button" class="btn btn-sm btn-primary addGates">Добавить</button></div>\n\
                                        <div>\n\
                                        <table class="table_gates table table-bordered">\n\
                                        <thead>\n\
                                        <tr>\n\
                                        <th>Наименование</th>\n\
                                        <th>Отображать на табло</th>\n\
                                        <th>Не назначать автоматически</th>\n\
                                        <th title="Приоритет нужен для автоматического режима работы (0-Самый высокий)">Приоритет</th>\n\
                                        </tr>\n\
                                        </thead>\n\
                                        <tbody>\n\
                                        </tbody>\n\
                                        </table>\n\
                                        </div>\n\
                                    </div>\n\
                                    <div class="btnConfigblock float-left pt-1 pb-3" style="text-align: center; display: block;">\n\
                                        <div class="configTitleText mb-3"><strong>Работа логики</strong></div>\n\
                                        <div class="configOptionsText">\n\
                                            <select class="form-control setConfigNotkppSelect" style="width: 180px;">\n\
                                                <option value="0">Автоматически</option>\n\
                                                <option value="1">В ручную</option>\n\
                                            </select>\n\
                                        </div>\n\
                                        <div></div>\n\
                                        <div class="configTitleText"><strong>Управлять через<br>сканирование штрих кода</strong></div>\n\
                                        <div class="configOptionsText">\n\
                                            <select class="form-control setConfigAreaSuppliersSelect" style="width: 180px;">\n\
                                                <option value="0">Стандартный режим</option>\n\
                                                <option value="1">Через сканирование</option>\n\
                                            </select>\n\
                                        </div>\n\
                                        <div></div>\n\
                                        <div>\n\
                                            <div class="saveConfigResulte"></div>\n\
                                            <button type="button" class="btn btn-success mt-2 saveConfig">Применить</button>\n\
                                        </div>\n\
                                    </div>\n\
                                    <div style="display: none;"><a href="javascript:void(0)" class="btn btn-primary update_table">Обновить</a></div>\n\
                                    </div>\n\
                                </div>');

                $(".setConfigNotkppSelect option[value=" + not_kpp + "]").attr("selected", "selected");
                $(".setConfigAreaSuppliersSelect option[value=" + area_suppliers + "]").attr("selected", "selected");

                // Раскрывае блок с настройками
                $(".configBlockOpen").unbind('onclick').click(function () {
                    $(this).find('.img_transform')[0].classList.toggle('rotate180');
                    if ($(this).attr('data-click-state') == 1) {
                        $(this).attr('data-click-state', 0);
                        $(".configBlock").css("right", "-14px");
                        $(".Configblock2").hide('200');
                    }
                    else {
                        $(this).attr('data-click-state', 1);
                        $(".configBlock").css("right", "0px");
                        $(".Configblock2").show('200');
                    }
                });

                // Отобразить или скрыть настройки
                // $(".btnConfigShow").unbind('click').click(function () {
                //     $(".btnConfigblock").toggle('show');
                // });

                $(".update_table").unbind("click").click(function () {
                    queue.get_table_data();
                });
                // Сохранить настройки
                $(".saveConfig").unbind('click').click(function () {
                    not_kpp = $(".setConfigNotkppSelect").val();
                    area_suppliers = $(".setConfigAreaSuppliersSelect").val();
                    queue.jpost(
                        function (data) {
                            $(".saveConfigResulte").html(data['str']);
                        },
                        '/post/?set_config=1',
                        {'not_kpp': not_kpp, 'area_suppliers': area_suppliers}
                    );
                });


                // Сохранить настройки
                $(".addGates").unbind('click').click(function () {
                    queue.jpost(
                        function (data) {
                            $(".saveGatesResulte").html(data['str']);
                            queue.init_gates();
                        },
                        '/post/?add_gates=1',
                        {}
                    );
                });

                queue.init_gates();
            },
            '/post/?get_config=1',
            {}
        );
        // select * from queue_config_queue_config
    }

    // Отобразить статус ворот
    init_zone_status() {
        console.log('init_zone_status');
        var html = '<div class="statusZone">\n\
            <div class="statusZoneTitle">Статус ворот</div>\n\
            <div class="statusZoneBlock" style="display: block;">\n\
                <div class="statusList">\n\
                <table style="width: 100px;"><tbody></tbody></table>\n\
                </div>\n\
            </div>\n\
        </div>';
        queue.append(html);
    }

    init_gates() {
        queue.jpost(
            function (data) {
                gates = [];
                $(".table_gates").find('tbody').html("");
                $(".statusList").find('tbody').html("");
                if (not_kpp == 0) {
                    $(".setGatesSelect").append('<option value="0">Автоматически</option>');
                } else {
                    $(".setGatesSelect").append('<option value="0">...</option>');
                }

                if (data.length > 0) {
                    for (var i = 0; i < data.length; i++) {
                        var gatename = data[i]['fields']['gatename'];
                        var status = data[i]['fields']['status'];
                        var supplername = data[i]['fields']['supplername'];
                        var queue_num = data[i]['fields']['queue_num'];
                        // Отображать на табло
                        var checked_showdisplay = '';
                        if (data[i]['fields']['showdisplay'] == '1') {
                            checked_showdisplay = 'checked="checked"';
                        }
                        var showdisplay = '<input type="checkbox" name="showdisplay" class="showdisplay showdisplay_fast_update" attr_pk="' + data[i]['pk'] + '" attr_table="gates_gates" attr_row="showdisplay" value="1" ' + checked_showdisplay + ' >';
                        // Не назначать автоматически
                        var checked_donotautomatic = '';
                        if (data[i]['fields']['donotautomatic'] == '1') {
                            checked_donotautomatic = 'checked="checked"';
                        }
                        var donotautomatic = '<input type="checkbox" name="donotautomatic" class="donotautomatic donotautomatic_fast_update" attr_pk="' + data[i]['pk'] + '" attr_table="gates_gates" attr_row="donotautomatic" value="1" ' + checked_donotautomatic + ' >';

                        var priority = '<input type="text" name="priority" class="priority priority_fast_update" attr_pk="' + data[i]['pk'] + '" attr_table="gates_gates" attr_row="priority" value="' + data[i]['fields']['priority'] + '" title="Приоритет нужен для автоматического режима работы (0-Самый высокий)" style="width: 40px;">';
                        var h = '<tr elm="' + data[i]['pk'] + '">' +
                            '<td>' + gatename + '</td>' +
                            '<td>' + showdisplay + '</td>' +
                            '<td>' + donotautomatic + '</td>' +
                            '<td>' + priority + '</td>' +
                            '</tr>';
                        gates.push(data[i]);

                        $(".table_gates").find('tbody').append(h);
                        // Обновление блока со статусаи
                        var listGateText = '—';
                        if (queue_num.length > 0) {
                            listGateText = queue_num + ' <span style="font-size: 0.7rem;">' + supplername + '</span>';
                        }

                        var html = '<tr><td style="font-size: 22px;white-space: nowrap;">' + gatename[0] + '-' + gatename[gatename.length - 1] + '</td><td style="font-size: 22px;white-space: nowrap;">' + listGateText + '</td></tr>';

                        $(".statusList").find('tbody').append(html);

                        //  Заполним поле для выбора ворот
                        if (data[i]['fields']['showdisplay'] == '1') {
                            $(".setGatesSelect").append('<option value="' + data[i]['pk'] + '">' + gatename + '</option>');
                        }
                    }
                    /*
                     * Активируем поля для сохраниния
                     */
                    queue.init_fast_update('.showdisplay_fast_update', function () {
                        $(".saveConfigResulte").html(data['str']);
                        queue.init_gates();
                    });
                    queue.init_fast_update('.donotautomatic_fast_update', function () {
                        $(".saveConfigResulte").html(data['str']);
                        queue.init_gates();
                    });
                    queue.init_fast_update('.priority_fast_update', function () {
                        $(".saveConfigResulte").html(data['str']);
                        queue.init_gates();
                    });
                }


            },
            '/post/?get_gates=1',
            {}
        );
    }

    // Быстрое обновление поля
    init_fast_update(elm, func) {
        $(elm).unbind('change').change(function () {
            var attr_table = $(this).attr("attr_table");
            var attr_row = $(this).attr("attr_row");
            var attr_pk = $(this).attr("attr_pk");
            var val = '';
            var type = $(this).attr("type");
            // если элемент checkbox
            if (type == "checkbox") {
                if ($(this).prop('checked')) {
                    val = 1;
                } else {
                    val = 0;
                }
            } else {
                val = $(this).val();
            }
            queue.jpost(
                function (data) {
                    func(data);
                },
                '/post/?fast_update=1',
                {'attr_table': attr_table, 'attr_row': attr_row, 'pk': attr_pk, 'val': val}
            );
        });
    }


    // Статус с трокой
    status_str(v) {
        var val = '-';
        switch (v) {
            case 0:
                val = 'Ожидается...';
                break;
            case 1:
                val = 'Приехал';
                break;
            case 2:
                val = 'Назначены ворота';
                break;
            case 3:
                val = '-';
                break;
            case 4:
                val = 'Освободил ворота';
                break;
            case 5:
                val = '-';
                break;
            case 9:
                val = '-';
                break;
        }

    }

    init_supluers_select() {
        for (var i = 0; i < queue_elms.length; i++) {
            console.log(queue_elms[i]);
            if (queue_elms[i]['fields']['status'] == '0') {
                $('.setSupplerSelect').append('<option value="' + queue_elms[i]['fields']['externalcode'] + '">' + queue_elms[i]['fields']['objname'] + '</option>');
            }
        }
        $('.setSupplerSelect').chosen({'width': '100%'});
    }


    // проверка на json
    isJsonString(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }

    focus(e) {
        setTimeout(function () {
            $(e)[0].focus();
        }, 500);
    }

    // Кодирование
    utf8_to_b64(str) {
        return window.btoa(unescape(encodeURIComponent(str)));
    }

    // Декодирование
    b64_to_utf8(str) {
        return decodeURIComponent(escape(window.atob(str)));
    }
}

var q = new Queue("block_queue");
q.init_table();

$(document).ready(function () {

});