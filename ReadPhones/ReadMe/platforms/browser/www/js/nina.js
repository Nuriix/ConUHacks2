var sHost = "nim-rd.nuance.mobi";
var sPort = 9443;

var socketPath = "nina-webapi/nina";

// For the NinaStartSession CONNECT message
var nmaid = "Nuance_ConUHack2017_20170119_210049";
var nmaidKey = "0d11e9c5b897eefdc7e0aad840bf4316a44ea91f0d76a2b053be294ce95c7439dee8c3a6453cf7db31a12e08555b266d54c2300470e4140a4ea4c8ba285962fd";
var username = "websocket_sample";

// For the NinaStartSession COMMAND message. All set in the startSession() index.html page
var appName = "NiM_Team_NIQS_2";
var companyName = "NES_NIQS";
var cloudModelVersion = "1.0";
var clientAppVersion = "0.0";
var defaultAgent = "http://ac-srvozrtr01.dev.ninaweb.nuance.com/nuance-nim_team-englishus-WebBotRouter/jbotservice.asmx/TalkAgent";

// Audio handlers
var audioContext = initAudioContext();
var audioPlayer = new AudioPlayer(audioContext); // For the play audio command

// The current command (used when receiving end-of-speech and beginning-of-speech)
var currentCommand;

// The WebSocket
var socket;

function initWebSocket() {

    socket = new WebSocket("wss://" + sHost + ":" + sPort + "/" + socketPath); // The WebSocket must be secure "wss://"
    socket.binaryType = "arraybuffer"; // Important for receiving audio

    socket.onopen = function () {
        console.log("WebSocket connection opened.");

        socket.send(JSON.stringify({
            connect: {
                nmaid: nmaid,
                nmaidKey: nmaidKey,
                username: username
            }
        }));
        var version = $("#api_version")[0];
        socket.send(JSON.stringify({
            command: {
                name: "NinaStartSession",
                logSecurity: $('#start-end_logSecurity')[0].value,
                appName: appName,
                companyName: companyName,
                cloudModelVersion: cloudModelVersion,
                clientAppVersion: clientAppVersion,
                agentURL: defaultAgent,
                apiVersion: "1.0"
            }
        }));
        currentCommand = "NinaStartSession";
    };

    socket.onclose = function () {
        if(!alert("WebSocket connection closed.")) {
            window.location.reload(true);
        }
    };

    socket.onmessage = function (event) {
        console.log("socket RECEIVED:");

        if (isOfType("ArrayBuffer", event.data))
        { // The play audio command will return ArrayBuffer data to be played
            console.log("ArrayBuffer");
            audioPlayer.play(event.data);
        }
        else
        { // event.data should be text and you can parse it
            var response = JSON.parse(event.data);
            console.log(response);

            if (response.ControlData)
            {
                if (response.ControlData === "beginning-of-speech") {
                    if (currentCommand == "NinaPlayAudioWithBargeIn") {
                        $('#playaudio_results').text(JSON.stringify(response, null, 4));
                        audioPlayer.stop(); // stop the TTS
                    }
                    else if (currentCommand == "NinaDoSpeechRecognition" || currentCommand == "NinaDoSpeechRecognition_fromAudioFile") {
                        $('#sr_results').text(JSON.stringify(response, null, 4));
                    }
                    else if (currentCommand == "NinaDoSpeechRecognitionAndNLU_NR" || currentCommand == "NinaDoSpeechRecognitionAndNLU_NR_fromAudioFile") {
                        $('#nlu_nr_srResults').text(JSON.stringify(response, null, 4));
                    }
                    else if (currentCommand == "NinaDoSpeechRecognitionAndNLU_NLE" || currentCommand == "NinaDoSpeechRecognitionAndNLU_NLE_fromAudioFile") {
                        $('#nlu_nle_srResults').text(JSON.stringify(response, null, 4));
                    }
                    else if (currentCommand == "NinaDoSpeechRecognitionAndDialog_NIW" || currentCommand == "NinaDoSpeechRecognitionAndDialog_NIW_fromAudioFile") {
                        $('#dialog_niw_srResults').text(JSON.stringify(response, null, 4));
                    }
                    else if (currentCommand == "NinaDoSpeechRecognitionAndDialog_NCE" || currentCommand == "NinaDoSpeechRecognitionAndDialog_NCE_fromAudioFile") {
                        $('#dialog_nce_srResults').text(JSON.stringify(response, null, 4));
                    }
                    else if (currentCommand == "NinaEnrollUser" || currentCommand == "NinaAuthenticateUser") {
                        $('#vp_results').text(JSON.stringify(response, null, 4));
                    }
                    else alert(JSON.stringify(response));
                }
                else if (response.ControlData === "end-of-speech") {
                    if (currentCommand == "NinaPlayAudioWithBargeIn") {
                        $('#playaudio_results').text(JSON.stringify(response, null, 4));
                        stopBargeIn(); // stop the recording.
                    }
                    else if (currentCommand == "NinaDoSpeechRecognition") {
                        $('#sr_results').text(JSON.stringify(response, null, 4));
                        stopSRRecording();
                    }
                    else if (currentCommand == "NinaDoSpeechRecognitionAndNLU_NR") {
                        $('#nlu_nr_srResults').text(JSON.stringify(response, null, 4));
                        stopNLUNRRecording();
                    }
                    else if (currentCommand == "NinaDoSpeechRecognitionAndNLU_NLE") {
                        $('#nlu_nle_srResults').text(JSON.stringify(response, null, 4));
                        stopNLUNLERecording();
                    }
                    else if (currentCommand == "NinaDoSpeechRecognitionAndDialog_NIW") {
                        $('#dialog_niw_srResults').text(JSON.stringify(response, null, 4));
                        stopDialogNiwRecording();
                    }
                    else if (currentCommand == "NinaDoSpeechRecognitionAndDialog_NCE") {
                        $('#dialog_nce_srResults').text(JSON.stringify(response, null, 4));
                        stopDialogNCERecording();
                    }
                    else if (currentCommand == "NinaEnrollUser") {
                        $('#vp_results').text(JSON.stringify(response, null, 4));
                        vpStopEnrollRecording();
                    }
                    else if (currentCommand == "NinaAuthenticateUser") {
                        $('#vp_results').text(JSON.stringify(response, null, 4));
                        vpStopAuthenticateRecording();
                    }
                    else alert(JSON.stringify(response));
                }
                else alert(JSON.stringify(response));
            }
            else if (response.QueryResult)
            {
                if (response.QueryResult.result_type === "NinaStartSession") {
                    ui_sessionHasStarted();
                    currentCommand = null;
                }
                else if (response.QueryResult.result_type === "NinaEndSession") {
                    ui_sessionHasEnded();
                    currentCommand = null;
                    socket.close();
                    socket = undefined;
                }
                else if (response.QueryResult.result_type === "NinaPlayAudioWithBargeIn") {
                    $('#playaudio_results').text(JSON.stringify(response, null, 4));
                }
                else if (response.QueryResult.result_type === "NinaGetLogs") {
                    for (i in response.QueryResult.results) {
                        var obj = response.QueryResult.results[i];
                        ui_gotLog(Object.keys(obj)[0], obj[Object.keys(obj)[0]]);
                    }
                    currentCommand = null;
                }
                else if ($.inArray(response.QueryResult.result_type, ["NinaDoMREC", "NinaDoNTE", "NinaDoNR"]) >= 0 ) {
                    $('#sr_results').text(JSON.stringify(response, null, 4));
                    if (currentCommand == "NinaDoSpeechRecognition_fromAudioFile" && response.QueryResult.final_response) {
                        ui_stopSRRecording();
                        currentCommand = null;
                    }
                }
                else if (response.QueryResult.result_type === "NinaDoMRECAndNLU_NR" ||
                        response.QueryResult.result_type === "NinaDoNTEAndNLU_NR" ||
                        response.QueryResult.result_type === "NinaDoNRAndNLU_NR" ||
                        response.QueryResult.result_type === "NinaDoNLU_NR") {
                    if (response.QueryResult.final_response) {
                        if (currentCommand == "NinaDoSpeechRecognitionAndNLU_NR_fromAudioFile") {
                            ui_stopNLUNRRecording();
                        }
                        $('#nlu_nr_results').text(JSON.stringify(response, null, 4));
                        currentCommand = null;
                    } else {
                        $('#nlu_nr_srResults').text(JSON.stringify(response, null, 4));
                    }                }
                else if (response.QueryResult.result_type === "NinaDoMRECAndNLU_NLE" ||
                        response.QueryResult.result_type === "NinaDoNTEAndNLU_NLE" ||
                        response.QueryResult.result_type === "NinaDoNRAndNLU_NLE" ||
                        response.QueryResult.result_type === "NinaDoNLU_NLE") {
                    if (response.QueryResult.final_response) {
                        if (currentCommand == "NinaDoSpeechRecognitionAndNLU_NLE_fromAudioFile") {
                            ui_stopNLUNLERecording();
                        }
                        $('#nlu_nle_results').text(JSON.stringify(response, null, 4));
                        currentCommand = null;
                    } else {
                        $('#nlu_nle_srResults').text(JSON.stringify(response, null, 4));
                    }
                }
                else if (response.QueryResult.result_type === "NinaDoDialog_NIW" ||
                        response.QueryResult.result_type === "NinaDoMRECAndDialog_NIW" ||
                        response.QueryResult.result_type === "NinaDoNTEAndDialog_NIW" ||
                        response.QueryResult.result_type === "NinaDoNRAndDialog_NIW") {
                    if (response.QueryResult.final_response) {
                        if (currentCommand == "NinaDoSpeechRecognitionAndDialog_NIW_fromAudioFile") {
                            ui_stopDialogNIWRecording();
                        }
                        $('#dialog_niw_dialogResults').text(JSON.stringify(response, null, 4));
                        currentCommand = null;
                    } else {
                        $('#dialog_niw_srResults').text(JSON.stringify(response, null, 4));
                    }
                }
                else if (response.QueryResult.result_type === "NinaDoDialog_NCE" ||
                        response.QueryResult.result_type === "NinaDoMRECAndDialog_NCE" ||
                        response.QueryResult.result_type === "NinaDoNTEAndDialog_NCE" ||
                        response.QueryResult.result_type === "NinaDoNRAndDialog_NCE") {
                    if (response.QueryResult.final_response) {
                        if (currentCommand == "NinaDoSpeechRecognitionAndDialog_NCE_fromAudioFile") {
                            ui_stopDialogNCERecording();
                        }
                        $('#dialog_nce_dialogResults').text(JSON.stringify(response, null, 4));
                        currentCommand = null;
                    } else {
                        $('#dialog_nce_srResults').text(JSON.stringify(response, null, 4));
                    }
                }
                // Project Vocabulary responses:
                else if (response.QueryResult.result_type === "ActivateProjectVocabulary") {
                    ui_ProjectVocabActivate();
                    $('#config_results').text(JSON.stringify(response, null, 4));
                    currentCommand = null;
                }
                else if (response.QueryResult.result_type === "DeactivateProjectVocabulary") {
                    ui_ProjectVocabDeactivate();
                    $('#config_results').text(JSON.stringify(response, null, 4));
                    currentCommand = null;
                }
                else if (response.QueryResult.result_type === "GetAllProjectVocabularies" ||
                        response.QueryResult.result_type === "DeleteProjectVocabulary") {
                    $('#config_results').text(JSON.stringify(response, null, 4));
                    currentCommand = null;
                }
                else if (response.QueryResult.result_type === "UploadProjectVocabulary") {
                    $('#config_results').text(JSON.stringify(response, null, 4));
                    //TODO: if status == TRAINED && upload from file, remove file from server!
                }
                // Dynamic Vocabulary responses:
                else if (response.QueryResult.result_type === "ActivateDynamicVocabulary" ||
                        response.QueryResult.result_type === "DeactivateDynamicVocabulary" ||
                        response.QueryResult.result_type === "GetAllDynamicVocabularies" ||
                        response.QueryResult.result_type === "UploadDynamicVocabulary") {
                    $('#config_results').text(JSON.stringify(response, null, 4));
                    currentCommand = null;
                }
                // Business Logic functions:
                else if (response.QueryResult.result_type === "NinaDoBusinessLogic"){
                    $('#kq_result').text(JSON.stringify(response, null, 4));
                    currentCommand = null;
                }
                else if (response.QueryResult.result_type === "NinaBLEStatus"){
                    $('#kq_status').text(JSON.stringify(response, null, 4));
                    currentCommand = null;
                }
                else if (response.QueryResult.result_type === "NinaUploadBusinessLogic"){
                    $('#kq_upload_result').text(JSON.stringify(response, null, 4));
                    currentCommand = null;
                }
                else alert(JSON.stringify(response));
            }
            else if (response.QueryInfo)
            {
                if (response.QueryInfo.result_type === "NinaStartSession") {
                    if (response.QueryInfo.info.niwAgent)
                        $('#agent_url')[0].value = response.QueryInfo.info.niwAgent
                    if (response.QueryInfo.info.companyName)
                        $('#company_name')[0].value = response.QueryInfo.info.companyName;
                    if (response.QueryInfo.info.appName)
                        $('#application_name')[0].value = response.QueryInfo.info.appName;
                    if (response.QueryInfo.info.grammarVersion)
                        $('#nes_version')[0].value = response.QueryInfo.info.grammarVersion;
                }
            }
            else if (response.VocalPassword)
            {
                $('#vp_results').text(JSON.stringify(response, null, 4));

                var vpResponse = response.VocalPassword;
                // VP session started: don't set current command to null!
                if (vpResponse.SessionInfo && vpResponse.SessionInfo.SessionId) {
                    $('#vp_results').text("New session started.");
                }
                // VP end session, check, enroll, authenticate: we can set current command to null.
                else {
                    if (vpResponse.boolean) { // check user enrollment.
                        ui_checkedUserEnrollment();
                    }
                    currentCommand = null;
                }
            }
            else if (response.QueryRetry)
            {
                if (response.QueryRetry.result_type === "NinaPlayAudioWithBargeIn") {
                    $('#playaudio_results').text(JSON.stringify(response, null, 4));
                    if (audioRecorder != undefined) stopRecording();
                    if (response.QueryRetry.final_response) {
                        ui_stopBargeIn();
                        currentCommand = null;
                    }
                }
                else if ($.inArray(response.QueryRetry.result_type, ["NinaDoMREC", "NinaDoNTE", "NinaDoNR", "NinaDoSpeechRecognition"]) >= 0 ) {
                    $('#sr_results').text(JSON.stringify(response, null, 4));
                    if (currentCommand == "NinaDoSpeechRecognition_fromAudioFile") {
                        ui_stopSRRecording();
                    }
                    currentCommand = null;
                }
                else if (response.QueryRetry.result_type === "NinaDoDialog_NIW" ||
                        response.QueryRetry.result_type === "NinaDoMRECAndDialog_NIW" ||
                        response.QueryRetry.result_type === "NinaDoNTEAndDialog_NIW" ||
                        response.QueryRetry.result_type === "NinaDoNRAndDialog_NIW" ||
                        response.QueryRetry.result_type === "NinaDoSpeechRecognitionAndDialog_NIW") {
                    $('#dialog_niw_dialogResults').text(JSON.stringify(response, null, 4));
                    if (currentCommand == "NinaDoSpeechRecognitionAndDialog_NIW_fromAudioFile") {
                        ui_stopDialogNIWRecording();
                    }
                    currentCommand = null;
                }
                else if (response.QueryRetry.result_type === "NinaDoDialog_NCE" ||
                        response.QueryRetry.result_type === "NinaDoMRECAndDialog_NCE" ||
                        response.QueryRetry.result_type === "NinaDoNTEAndDialog_NCE" ||
                        response.QueryRetry.result_type === "NinaDoNRAndDialog_NCE" ||
                        response.QueryRetry.result_type === "NinaDoSpeechRecognitionAndDialog_NCE") {
                    $('#dialog_nce_dialogResults').text(JSON.stringify(response, null, 4));
                    if (currentCommand == "NinaDoSpeechRecognitionAndDialog_NCE_fromAudioFile") {
                        ui_stopDialogNCERecording();
                    }
                    currentCommand = null;
                }
                else if (response.QueryRetry.result_type === "NinaDoNLU_NR" ||
                        response.QueryRetry.result_type === "NinaDoMRECAndNLU_NR" ||
                        response.QueryRetry.result_type === "NinaDoNTEAndNLU_NR" ||
                        response.QueryRetry.result_type === "NinaDoNRAndNLU_NR" ||
                        response.QueryRetry.result_type === "NinaDoSpeechRecognitionAndNLU_NR") {
                    $('#nlu_nr_results').text(JSON.stringify(response, null, 4));
                    if (currentCommand == "NinaDoSpeechRecognitionAndNLU_NR_fromAudioFile") {
                        ui_stopNLUNRRecording();
                    }
                    currentCommand = null;
                }
                else if (response.QueryRetry.result_type === "NinaDoNLU_NLE" ||
                        response.QueryRetry.result_type === "NinaDoMRECAndNLU_NLE" ||
                        response.QueryRetry.result_type === "NinaDoNTEAndNLU_NLE" ||
                        response.QueryRetry.result_type === "NinaDoNRAndNLU_NLE" ||
                        response.QueryRetry.result_type === "NinaDoSpeechRecognitionAndNLU_NLE") {
                    $('#nlu_nle_results').text(JSON.stringify(response, null, 4));
                    if (currentCommand == "NinaDoSpeechRecognitionAndNLU_NLE_fromAudioFile") {
                        ui_stopNLUNLERecording();
                    }
                    currentCommand = null;
                }
                else if (response.QueryRetry.result_type === "ActivateProjectVocabulary" ||
                        response.QueryRetry.result_type === "DeleteProjectVocabulary" ||
                        response.QueryRetry.result_type === "UploadProjectVocabulary" ||
                        response.QueryRetry.result_type === "ActivateDynamicVocabulary" ||
                        response.QueryRetry.result_type === "DeactivateDynamicVocabulary" ||
                        response.QueryRetry.result_type === "UploadDynamicVocabulary") {
                    $('#config_results').text(JSON.stringify(response, null, 4));
                    currentCommand = null;
                }
                else if ($.inArray(response.QueryRetry.result_type, ["NinaEnrollUser", "NinaVerifyUserEnrollment", "NinaAuthenticateUser"]) >= 0 ) {
                    $('#vp_results').text(JSON.stringify(response, null, 4));
                    ui_checkedUserEnrollment(); // re-enable the buttons.
                    currentCommand = null;
                }
                else if (response.QueryRetry.result_type === "NinaDoBusinessLogic"){
                    $('#kq_result').text(JSON.stringify(response, null, 4));
                    currentCommand = null;
                }
                else if (response.QueryRetry.result_type === "NinaBLEStatus"){
                    $('#kq_status').text(JSON.stringify(response, null, 4));
                    currentCommand = null;
                }
                else if (response.QueryRetry.result_type === "NinaUploadBusinessLogic"){
                    $('#kq_upload_result').text(JSON.stringify(response, null, 4));
                    currentCommand = null;
                }
                else alert(JSON.stringify(response));
            }
            else if (response.QueryError)
            {
                if ($.inArray(response.QueryError.result_type, ["NinaStartSession", "NinaEndSession", "NinaPlayAudio"]) >= 0 ) {
                    alert(JSON.stringify(response));
                    currentCommand = null;
                }
                else if (response.QueryError.result_type === "NinaPlayAudioWithBargeIn") {
                    $('#playaudio_results').text(JSON.stringify(response, null, 4));
                    if (audioRecorder != undefined) stopRecording();
                    if (response.QueryError.final_response) {
                        ui_stopBargeIn();
                        currentCommand = null;
                    }
                }
                else if ($.inArray(response.QueryError.result_type, ["NinaDoMREC", "NinaDoNTE", "NinaDoNR", "NinaDoSpeechRecognition"]) >= 0 ) {
                    $('#sr_results').text(JSON.stringify(response, null, 4));
                    if (currentCommand == "NinaDoSpeechRecognition_fromAudioFile") {
                        ui_stopSRRecording();
                    }
                    currentCommand = null;
                }
                else if ($.inArray(response.QueryError.result_type, ["ActivateProjectVocabulary", "DeactivateProjectVocabulary", "DeleteProjectVocabulary",
                        "UploadProjectVocabulary", "GetAllProjectVocabularies", "GetAllDynamicVocabularies", "ActivateDynamicVocabulary",
                        "DeactivateDynamicVocabulary", "UploadDynamicVocabulary"]) >= 0 ) {
                    $('#config_results').text(JSON.stringify(response, null, 4));
                    currentCommand = null;
                }
                else if (response.QueryError.result_type === "NinaDoMRECAndNLU_NR" ||
                        response.QueryError.result_type === "NinaDoNTEAndNLU_NR" ||
                        response.QueryError.result_type === "NinaDoNRAndNLU_NR" ||
                        response.QueryError.result_type === "NinaDoNLU_NR" ||
                        response.QueryError.result_type === "NinaDoSpeechRecognitionAndNLU_NR") {
                    $('#nlu_nr_results').text(JSON.stringify(response, null, 4));
                    if (currentCommand == "NinaDoSpeechRecognitionAndNLU_NR_fromAudioFile") {
                        ui_stopNLUNRRecording();
                    }
                    currentCommand = null;
                }
                else if (response.QueryError.result_type === "NinaDoMRECAndNLU_NLE" ||
                        response.QueryError.result_type === "NinaDoNTEAndNLU_NLE" ||
                        response.QueryError.result_type === "NinaDoNRAndNLU_NLE" ||
                        response.QueryError.result_type === "NinaDoNLU_NLE" ||
                        response.QueryError.result_type === "NinaDoSpeechRecognitionAndNLU_NLE") {
                    $('#nlu_nle_results').text(JSON.stringify(response, null, 4));
                    if (currentCommand == "NinaDoSpeechRecognitionAndNLU_NLE_fromAudioFile") {
                        ui_stopNLUNLERecording();
                    }
                    currentCommand = null;
                }
                else if (response.QueryError.result_type === "NinaDoDialog_NIW" ||
                        response.QueryError.result_type === "NinaDoMRECAndDialog_NIW" ||
                        response.QueryError.result_type === "NinaDoNTEAndDialog_NIW" ||
                        response.QueryError.result_type === "NinaDoNRAndDialog_NIW" ||
                        response.QueryError.result_type === "NinaDoSpeechRecognitionAndDialog_NIW") {
                    $('#dialog_niw_dialogResults').text(JSON.stringify(response, null, 4));
                    if (currentCommand == "NinaDoSpeechRecognitionAndDialog_NIW_fromAudioFile") {
                        ui_stopDialogNIWRecording();
                    }
                    currentCommand = null;
                }
                else if (response.QueryError.result_type === "NinaDoDialog_NCE" ||
                        response.QueryError.result_type === "NinaDoMRECAndDialog_NCE" ||
                        response.QueryError.result_type === "NinaDoNTEAndDialog_NCE" ||
                        response.QueryError.result_type === "NinaDoNRAndDialog_NCE" ||
                        response.QueryError.result_type === "NinaDoSpeechRecognitionAndDialog_NCE") {
                    $('#dialog_nce_dialogResults').text(JSON.stringify(response, null, 4));
                    if (currentCommand == "NinaDoSpeechRecognitionAndDialog_NCE_fromAudioFile") {
                        ui_stopDialogNCERecording();
                    }
                    currentCommand = null;
                }
                else if ($.inArray(response.QueryError.result_type, ["NinaEnrollUser", "NinaVerifyUserEnrollment", "NinaAuthenticateUser"]) >= 0 ) {
                    $('#vp_results').text(JSON.stringify(response, null, 4));
                    ui_checkedUserEnrollment(); // re-enable the buttons.
                    currentCommand = null;
                }
                else if (response.QueryError.result_type === "NinaDoBusinessLogic"){
                    $('#kq_result').text(JSON.stringify(response, null, 4));
                    currentCommand = null;
                }
                else if (response.QueryError.result_type === "NinaBLEStatus"){
                    $('#kq_status').text(JSON.stringify(response, null, 4));
                    currentCommand = null;
                }
                else if (response.QueryError.result_type === "NinaUploadBusinessLogic"){
                    $('#kq_upload_result').text(JSON.stringify(response, null, 4));
                    currentCommand = null;
                }
                else alert(JSON.stringify(response));
            }
            else alert(JSON.stringify(response));
        }
    };
}

function startSession() {
    ui_startSession();

    // Check parameters of the connection message.
    var lNmaid = $('#nmaid')[0].value;
    if (lNmaid.length > 0) {
        nmaid = lNmaid;
    }
    var lNmaidKey = $('#nmaid_key')[0].value;
    if (lNmaidKey.length > 0) {
        nmaidKey = lNmaidKey;
    }
    var lUsername = $('#username')[0].value;
    if (lUsername.length > 0) {
        username = lUsername;
    }
    // Check parameters of the start session message.
    var company_name = $('#company_name')[0].value;
    if (company_name.length > 0) {
        companyName = company_name;
    }
    var application_name = $('#application_name')[0].value;
    if (application_name.length > 0) {
        appName = application_name;
    }
    var nes_version = $('#nes_version')[0].value;
    if (nes_version.length > 0) {
        cloudModelVersion = nes_version;
    }
    clientAppVersion = $('#application_version')[0].value;
    var agent_url = $("#agent_url")[0].value;
    if (agent_url.length > 0) {
        defaultAgent = agent_url;
    }

    if (socket === undefined) {
        initWebSocket();
    }
}

function endSession() {
    ui_endSession();

    defaultAgent = "";
    
    socket.send(JSON.stringify({
        command: {
            name: "NinaEndSession",
            logSecurity: $('#start-end_logSecurity')[0].value
        }
    }));
    currentCommand = "NinaEndSession";
}

function playAudio(string text) {
	var inputText = fixLineBreaks(text);
	var engine = document.getElementById("playaudio_sr_engine").value;
	var mode = document.getElementById("playaudio_nte_mode").value;

	socket.send(JSON.stringify({
		command: {
			name: "NinaPlayAudio",
			logSecurity: $('#tts_logSecurity')[0].value,
			text: inputText,
			tts_type: "text"
		}
	}));
	currentCommand = "NinaPlayAudio";

	if ($('#barge-in')[0].checked) {
		ui_startBargeIn();
		currentCommand = "NinaPlayAudioWithBargeIn";
		record();
	}

}