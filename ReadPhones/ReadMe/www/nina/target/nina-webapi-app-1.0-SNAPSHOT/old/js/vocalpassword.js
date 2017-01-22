var vpProcessing = false;
var vpCmd = null;

$(document).ready(function() {
    $("#vpRecordInfo").hide();

    try {
        audio_context = initAudioContext();

        log('Audio context set up.');
        log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));

        if (!navigator.getUserMedia) {
            $("#vpRecord").addClass("pure-button-disabled");
        }
    } catch (e) {
        $("#vpRecord").addClass("pure-button-disabled");
        alert('No web audio support in this browser!');
    }
});

function vpCommand(cmd) {
    vpCmd = cmd;

    var completion = resultsVP;

    if (cmd == "STARTSESSION") {
        completion = vpOnStartSession;
    } else if (cmd == "ENDSESSION") {
        completion = vpOnEndSession;
    }

    if (cmd == "ENROLL" || cmd == "VERIFY") {
        $("#vpRecordInfo").show();
    } else {
        var command = ninaSession.vocalPassword(cmd);
        command.promise().then(completion);
        command.endCommand();

        $("#vpRecordInfo").hide();
    }
}

function vpSession() {
    if ($("#vpSession").hasClass("btn-primary")) {
        vpCommand("STARTSESSION");
    } else {
        vpCommand("ENDSESSION");
    }
}

function vpIsTrained() {
    vpCommand("ISTRAINED");
}

function vpEnroll() {
    vpCommand("ENROLL");
}

function vpVerify() {
    vpCommand("VERIFY");
}

function resultsVP(vp) {
    if (vp.ControlData) {
        console.log("Received control-data");
        stopRecording();
        vpAnimation(false);
    } else {
        logResponse(vp);
    }
}

function vpOnStartSession(vp) {
    resultsVP(vp);

    $("#vpSession").html('End Session');
    $("#vpSession").addClass("btn-danger");
    $("#vpSession").removeClass("btn-primary");

    $('#vpIsTrained').removeClass("disabled");
    $('#vpEnroll').removeClass("disabled");
    $('#vpVerify').removeClass("disabled");
}

function vpOnEndSession(vp) {
    resultsVP(vp);

    $("#vpSession").html('Start Session');
    $("#vpSession").removeClass("btn-danger");
    $("#vpSession").addClass("btn-primary");

    $('#vpIsTrained').addClass("disabled");
    $('#vpEnroll').addClass("disabled");
    $('#vpVerify').addClass("disabled");
}

function vpRecord() {
    if (isRecording) {
        shouldRecord = false;
        vpProcessing = true;

        log('Stopped recording...');
        log('Started processing...');

        vpAnimation(false);
    } else if (!vpProcessing) {
        asr(vpCmd);

        log('Started recording...');

        vpAnimation(true);
    }
}

function vpAnimation(animate) {
    if (animate) {
        $("#vpRecord").addClass("logo-glow");
    } else {
        $("#vpRecord").css("background-color", "black");
        $("#vpRecord").removeClass("logo-glow");
    }
}