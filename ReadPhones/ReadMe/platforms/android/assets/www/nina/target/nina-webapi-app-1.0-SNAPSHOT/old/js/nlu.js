Q.longStackSupport = true;


var nluExpertModeEnabled = false;

function expertMode() {
    if (nluExpertModeEnabled) {
        $("#nlu_expert_mode_button").html("Expert Mode");
        $("#nlu_text_to_send").val("");
    } else {

        var text_to_send = $("#nlu_text_to_send");

        $("#nlu_expert_mode_button").html("Normal Mode");
        var newContent = {
            text_to_interpret: text_to_send.val().trim(),
            REQUEST_INFO: ninaSession.default_grammar_list
        };
        text_to_send.val(JSON.stringify(newContent, null, 3));
    }

    textChanged();

    nluExpertModeEnabled = !nluExpertModeEnabled;
}

function requestNLU() {
    var text_to_interpret = fixLineBreaks($("#nlu_text_to_send").val());
    var text;
    var request_info;

    if (!$("#request_nlu_button").hasClass("disabled")) {
        if (nluExpertModeEnabled) {
            var requestObject = JSON.parse(text_to_interpret);
            text = requestObject.text_to_interpret;
            request_info = requestObject.REQUEST_INFO;
        } else {
            text = text_to_interpret;
            request_info = ninaSession.default_grammar_list;
        }

        ninaSession.nlu(text, request_info).then(logResponse, logError);
    }
}