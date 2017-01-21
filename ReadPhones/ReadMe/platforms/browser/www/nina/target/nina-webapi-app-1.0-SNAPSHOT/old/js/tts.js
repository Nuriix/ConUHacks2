Q.longStackSupport = true;

var defaultVoice = "Carol";
var defaultLanguage = "en-us";


var ttsExpertModeEnabled = false;

var audioSink = new AudioPlayer(initAudioContext());

function ttsExpertMode() {
    var $ttsToSend = $("#tts_to_send");
    if (ttsExpertModeEnabled) {
        $("#tts_expert_mode_button").html("Expert Mode");
        $ttsToSend.val("");
    } else {
        var body = {
            tts_input: $ttsToSend.val().trim(),
            tts_voice: $("#voice_selected").val(),
            tts_type: "text",
            tts_language: defaultLanguage
        };

        $("#tts_expert_mode_button").html("Normal Mode");
        $ttsToSend.val(JSON.stringify(body, null, 3));
    }

    textChanged("tts_to_send", "request_tts_button");

    ttsExpertModeEnabled = !ttsExpertModeEnabled;
}

function onSuccess(response) {
    if (response.QueryRetry) {
        log("Received QueryRetry: " + JSON.stringify(response, null, 3));
    }
    else if (!response.QueryResult) {
        log("Unexpected response: " + JSON.stringify(response, null, 3));
    }
    else {
        log("TTS completed successfully");
    }
}
function onError(response) {
    if (response.QueryError) {
        log("Received QueryError: " + JSON.stringify(response, null, 3));
    }
    else {
        log("Unexpected error: " + JSON.stringify(response, null, 3));
    }
}

function onData(response) {
    if (isOfType("ArrayBuffer", response)) {
        log("Received " + response.byteLength + " bytes of audio data.");
        audioSink.play(response).then(function () {
            log("and sent to the audio system.")
        });
    }
    else {
        log("Unexpected response: " + JSON.stringify(response, null, 3));
    }
}

function requestTTS() {

    if (!$("#request_tts_button").hasClass("disabled")) {
        var input = fixLineBreaks($("#tts_to_send").val());
        var tts_language = defaultLanguage;
        var tts_voice = $("#voice_selected").val();
        var tts_input = input;
        var tts_type = "text";

        if (ttsExpertModeEnabled) {
            var body = JSON.parse(input);
            tts_input = body.tts_input;
            if (body.tts_voice) tts_voice = body.tts_voice;
            if (body.tts_language) tts_language = body.tts_language;
            if (body.tts_type) tts_type = body.tts_type;
        }

        ninaSession.tts(tts_input, tts_type, tts_voice, tts_language).then(onSuccess, onError, onData)
    }
}

$(document).ready(function () {

    $(document).keypress(function (e) {
        var key = e.which;
        if (key == 13) {
            if (!$("#request_tts_button").hasClass("disabled")) {
                requestTTS();
            }
            return false;
        }
    });
});