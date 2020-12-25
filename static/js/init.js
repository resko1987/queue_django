$(function () {
    $("#dialog-link").click(function () {
        $( "#dialog" ).dialog( "open" );
    });
    $("#dialog").dialog({
        autoOpen: false,
        width: 400,
        buttons: [
            {
                text: "Ok",
                class: 'btn',
                click: function () {
                    console.log("ok");
                    $(this).dialog("close");
                }
            },
            {
                text: "Cancel",
                class: 'btn',
                click: function () {
                    console.log("Cancel");
                    $(this).dialog("close");
                }
            }
        ]
    });
});