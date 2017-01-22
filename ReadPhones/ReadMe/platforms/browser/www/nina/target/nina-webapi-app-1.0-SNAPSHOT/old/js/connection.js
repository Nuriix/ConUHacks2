Q.longStackSupport = true;

var ninaSession = new NinaSession();


function setConnection(){
    resetStates();
    if ($("#connection_button").hasClass("btn-primary")) {
        log("Connecting to NINA server");
        ninaURL = "wss://rd-internal-bl20-nim.nuance.mobi:8884/nina-websocket-api/nina";
        ninaSession.connect(ninaURL, connectionData).then(undefined, logError, onConnect);
    }else{
        $("#main-menu").addClass("hidden");
        $("#main-view").addClass("hidden");

        log("Disconnecting to NINA server");
        ninaSession.endSession().then(logResponse, logError);

        $("#connection_button").html('Connect');
        $("#connection_button").removeClass("btn-danger");
        $("#connection_button").addClass("btn-primary");

        $("#main-menu li").removeClass('active');
        $("#main-view div").removeClass('active');
        $("#varolii-menu li").removeClass('active');
    }
}

function resetStates(){
    $('#navbar').removeClass('in');

    $('#main-view textarea, #main-view input[type=text]').val('');
    $('#request_tts_button').addClass("disabled");
    $('#request_nlu_button').addClass("disabled");
    $('#request_nle_button').addClass("disabled");
    $('#request_dialog_button').addClass("disabled");

    $('#record_button').removeClass("disabled");
    $('#stop_button').addClass("disabled");

    stopRecording();
    isRecording = false;
    shouldRecord = false;
    recording = false;
    animation();

    $("#results").html("");

    $("#get").text("");
    $("#put").text("");
    $("#remove").text("");
    $("#putInfo").text("");
    $("#getInfo").text("");
}
function onConnect(evt) {
    $("#connection_button").html('Disconnect');
    $("#connection_button").addClass("btn-danger");
    $("#connection_button").removeClass("btn-primary");

    $("#main-menu").removeClass("hidden");
    $("#main-view").removeClass("hidden");
    return startSession(evt).done(extraGrammar);
}
// DESTROY
$(window).unload(function () {
    function disconnectSession() {
        ninaSession.disconnect();
    }

    ninaSession.endSession().then(logResponse, logError).finally(disconnectSession);
});

      