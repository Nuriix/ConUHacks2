var audio_context;
var isRecording = false;
var shouldRecord = false;

function startRecording() {

    if (isRecording) {
        return;
    }

    asr("dictation_results");

    $("#record_button").html("Recording");
    $("#record_button").addClass("disabled");
    $("#stop_button").removeClass("disabled");

    log('Recording...');
}

function stopRecording() {

    if (!isRecording)
        return;

    shouldRecord = false;

    $("#record_button").html("Record");
    $("#record_button").removeClass("disabled");
    $("#stop_button").addClass("disabled");

    log('Stopped recording.');
}


$(document).ready(function () {

    const $recordButton = $("#record_button");
    try {

        audio_context = initAudioContext();
        log('Audio context set up.');
        log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));

        if (!navigator.getUserMedia) {
            $recordButton.addClass("pure-button-disabled");
        }
    } catch (e) {
        $recordButton.addClass("pure-button-disabled");
        alert('No web audio support in this browser!');
    }

});


function printDictationResults(message) {

    if (message.ControlData) {
        console.log("Received control-data");
        stopRecording();
    }
    else if (message.QueryResult && message.QueryResult.mrec_results) {
        var mrec_results = message.QueryResult.mrec_results;
        var transcription = mrec_results.transcriptions[0];
        var confidence = mrec_results.confidences[0];
        var final_response = mrec_results.final_response;
        if (final_response === 1)
            log("Dictation results: '" + transcription + "', confidence=" + confidence);
        $("#dictation_results").val(transcription);
    }
    else {
        logResponse(message);
    }
}

        