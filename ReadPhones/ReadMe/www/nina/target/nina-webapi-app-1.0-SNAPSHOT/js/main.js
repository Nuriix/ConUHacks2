// START - YOU WILL NEED TO OVERWRITE THESE VALUES
// Nina WebSocket Server

// var host = "mtl-blade20-vm53.nuance.com";
// var port = 8888; //8888, 8889
// var sHost = "rd-internal-bl20-nim.nuance.mobi";
// var sPort = 8881; //8881, 8882

var host = "mtl-blade20-vm142.nuance.com";
var port = 8888; // 8888, 8889, 8890, 8891
var sHost = "rd-internal-bl20-nim.nuance.mobi";
var sPort = 8884; // 8884, 8885, 8886, 8887

// var sHost = "nim-rd.nuance.mobi";
// var sPort = 9443;
// var sHost = "nim-webapi.nuance.mobi";
// var sPort = 443;

var socketPath = "nina-webapi/nina";

// For the NinaStartSession CONNECT message
var nmaid = "NinaCloud";
var nmaidKey = "b7635accb9e5f37de5c9d9cd7578b6a05015720c981c6e0104f720d400bde56cfd116e4aabeee418e5ab53116ac034c97b409c0579fea300a2ec5264e7796b0b";
var username = "webapp_vm142:84";

// For the NinaStartSession COMMAND message. All set in the startSession() index.html page
var appName; // SamDemoApp01, DisneyApp02
var companyName; // SamDemoCo01, Disney
var cloudModelVersion; // 0.0, 1.0 // NES grammar version
var clientAppVersion; // client app version ex: mobile app / web page
var defaultAgent; // niw dialog agent URL

// END - YOU WILL NEED TO OVERWRITE THESE VALUES


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
                apiVersion: version.options[version.selectedIndex].value
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

function nluNR() {

    if (!$("#nlu_nr_txtbutton").hasClass("disabled")) {
        var inputText = fixLineBreaks($("#nlu_nr_text").val());

        $('#nlu_nr_results').text("");

        socket.send(JSON.stringify({
            command: {
                name: "NinaDoNLU",
                logSecurity: $('#nlu_nr_logSecurity')[0].value,
                text: inputText,
                nlu_engine: "NR"
            }
        }));
        currentCommand = "NinaDoNLU_NR";
    }
}

function nluNLE() {

    if (!$("#nlu_nle_txtbutton").hasClass("disabled")) {
        var inputText = fixLineBreaks($("#nlu_nle_text").val());

        $('#nlu_nle_results').text("");

        socket.send(JSON.stringify({
            command: {
                name: "NinaDoNLU",
                logSecurity: $('#nlu_nle_logSecurity')[0].value,
                text: inputText,
                nlu_engine: "NLE",
                nlu_engine_parameters: {
                    nleModelURL: $('#nlu_nle_model')[0].value,
                    nleModelName: $('#nlu_nle_model_language')[0].value
                }
            }
        }));
        currentCommand = "NinaDoNLU_NLE";
    }
}

function dialogNiW() {

    if (!$("#dialog_niw_txtbutton").hasClass("disabled")) {
        var inputText = fixLineBreaks($("#dialog_niw_text").val());

        $('#dialog_niw_srResults').text("");
        $('#dialog_niw_dialogResults').text("");
        socket.send(JSON.stringify({
            command: {
                name: "NinaDoDialog",
                logSecurity: $('#dialog_niw_logSecurity')[0].value,
                text: inputText,
                dialog_engine: "NIW"
            }
        }));
        currentCommand = "NinaDoDialog_NIW";
    }
}

function dialogNCE() {

    if (!$("#dialog_nce_txtbutton").hasClass("disabled")) {
        var inputText = fixLineBreaks($("#dialog_nce_text").val());

        $('#dialog_nce_srResults').text("");
        $('#dialog_nce_dialogResults').text("");
        socket.send(JSON.stringify({
            command: {
                name: "NinaDoDialog",
                logSecurity: $('#dialog_nce_logSecurity')[0].value,
                text: inputText,
                dialog_engine: "NCE",
                dialog_engine_parameters: {
                    language: "",
                    nleModelURL: $('#dialog_nle_model')[0].value,
                    nleModelName: $('#dialog_nle_model_name')[0].value,
                    nceModelURL: $('#dialog_nce_model')[0].value,
                    nceModelName: $('#dialog_nce_model_name')[0].value,
                    nceModelVersion: $('#dialog_nce_model_version')[0].value
                }
            }
        }));
        currentCommand = "NinaDoDialog_NCE";
    }
}

function playAudio() {

    if (!$("#playaudio_button").hasClass("disabled")) {
        $('#playaudio_results').text("");

        var inputText = fixLineBreaks($("#playaudio_text").val());
        var engine = document.getElementById("playaudio_sr_engine").value;
        var mode = document.getElementById("playaudio_nte_mode").value;

        socket.send(JSON.stringify({
            command: {
                name: "NinaPlayAudio",
                logSecurity: $('#tts_logSecurity')[0].value,
                text: inputText,
                tts_type: "text",
                "barge-in": $('#barge-in')[0].checked,
                sr_engine: engine,
                sr_engine_parameters: {"operating_mode":mode}
            }
        }));
        currentCommand = "NinaPlayAudio";

        if ($('#barge-in')[0].checked) {
            ui_startBargeIn();
            currentCommand = "NinaPlayAudioWithBargeIn";
            record();
        }
    }
}

function stopBargeIn() {
    ui_stopBargeIn();
    stopRecording();
}

function getLogs() {
    socket.send(JSON.stringify({
        command: {
            name: "NinaGetLogs",
            logSecurity: $('#getLogs_logSecurity')[0].value
        }
    }));
    currentCommand = "NinaGetLogs";

    // showSendLogToTest();

}

/**
 * This will show the button to send the logs to test.
 */
// function showSendLogToTest(){
//     $('#sendlogstotest_button').show();
// }

/**
 * This will send the logs to test.
 */
// function sendLogToTest(){

//     //alert($('#log_session.log').find('a'));
//     var href = document.getElementById('log_session.log').getElementsByTagName('a')[0].getAttribute('href');

//     //Sending url in because we're not allowed to read insecure content in this server
//     var xhttp = new XMLHttpRequest();
//     xhttp.open("POST", "http://10.3.53.15:8082/api/Logs", true);
//     xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
//     xhttp.send("logUrl=" + href);

//     console.log('post request sent');

// }

function sendFile(file){
    var reader = new FileReader();
    var rawData = new ArrayBuffer();

    reader.loadend = function() {

    };

    reader.onload = function(e) {
        rawData = e.target.result;
        socket.send(rawData);
    };

    reader.readAsArrayBuffer(file);
}


// KQuery Server functions

function kQueryCall() {
    var projectName = $('#kq_project_name')[0].value;
    var versionNumber = $('#kq_version_number')[0].value;
    var functionName = $('#kq_function_name')[0].value;
    var inputBody = fixLineBreaks($("#kq_body_text").val());

    if (!$("#kq_body_txtbutton").hasClass("disabled")) {

        $('#kq_result').text("");
        var commandToSend = {
                name: "NinaDoBusinessLogic",
                logSecurity: $('#doBLE_logSecurity')[0].value,
                project: projectName,
                version: versionNumber,
                function: functionName,
                body: inputBody
            };
        console.log("Sending BLE command through socket:\n"+JSON.stringify(commandToSend));
        socket.send(JSON.stringify({
            command: commandToSend
        }));
        currentCommand = "NinaDoBusinessLogic";
    }
}

function kQueryStatus() {
    var commandToSend = {
            name: "NinaBLEStatus",
            logSecurity: $('#bleStatus_logSecurity')[0].value
        };
    $('#kq_status').text("");
    console.log("Sending BLE command through socket:\n"+JSON.stringify(commandToSend));
    socket.send(JSON.stringify({
        command: commandToSend
    }));
    currentCommand = "NinaBLEStatus";
}

function kQueryUpload() {
    var projectName = $('#kq_upload_project_name')[0].value;
    var versionNumber = $('#kq_upload_version_number')[0].value;
    var fileName =  $("#kq_choose_file")[0].files[0].name;

    $('#kq_upload_result').text("");
    var commandToSend = {
            name: "NinaUploadBusinessLogic",
            logSecurity: $('#uploadBLE_logSecurity')[0].value,
            project: projectName,
            version: versionNumber,
            filename: fileName
        };
    console.log("Upload script:\n"+JSON.stringify(commandToSend));
    socket.send(JSON.stringify({
        command: commandToSend
    }));
    sendFile($("#kq_choose_file")[0].files[0]);
    currentCommand = "NinaUploadBusinessLogic";
}


// Recording command functions

var audioRecorder;
var shouldStopRecording = true;

function record() {
    shouldStopRecording = false;  
    console.log("Recorder started.");

    // IMPORTANT Make sure you create a new AudioRecorder before you start recording to avoid any bugs !!!
    audioRecorder = new AudioRecorder(audioContext);

    audioRecorder.start().then(

            // This callback is called when "def.resolve" is called in the AudioRecorder.
            // def.resolve
            function () {
                console.log("Recorder stopped.");
            },

            // def.reject
            function () {
                console.log("Recording failed!!!");
            },

            // def.notify
            function (data) { // When the recorder receives audio data
                console.log("Audio data received...");

                if (shouldStopRecording) {
                    return;
                }

                // tuple: [encodedSpx, ampArray]
                //   resampled audio as Int16Array 
                //   amplitude data as Uint8Array
                var frames = data[0]; // Int16Array

                socket.send(frames.buffer);
            }
    );
}

function stopRecording() {
    shouldStopRecording = true;

    audioRecorder.stop();
    audioRecorder = undefined;

    socket.send(JSON.stringify({
        endcommand: {}
    }));
}

function startSRRecording() {
    ui_startSRRecording();

    var engine = document.getElementById("sr_engine").value;
    var mode = document.getElementById("nte_mode").value;

    if ($('#sr_formURL')[0].checked) {
        socket.send(JSON.stringify({
            command: {
                name: "NinaDoSpeechRecognition",
                logSecurity: $('#sr_logSecurity')[0].value,
                sr_engine: engine,
                sr_engine_parameters: {"operating_mode":mode},
                sr_audio_file: $('#srFromFile_url')[0].value // https://dl.dropboxusercontent.com/s/23knztcspmmrcii/9.%20Famous%20Full%20Obama%20Speech%20on%20Race%20Relations%20-%20A%20More%20Perfect%20Union.mp4
            }
        }));
        currentCommand = "NinaDoSpeechRecognition_fromAudioFile";
    }
    else {
        socket.send(JSON.stringify({
            command: {
                name: "NinaDoSpeechRecognition",
                logSecurity: $('#sr_logSecurity')[0].value,
                sr_engine: engine,
                sr_engine_parameters: {"operating_mode":mode}
            }
        }));
        currentCommand = "NinaDoSpeechRecognition";
        record();
    }
}

function stopSRRecording() {
    ui_stopSRRecording();
    stopRecording();
}

function startNLUNRRecording() {
    ui_startNLUNRRecording();

    var srEngine = document.getElementById("nlu_nr_sr_engine").value;
    var mode = document.getElementById("nlu_nr_nte_mode").value;

    if ($('#nlu_nr_sr_formURL')[0].checked) {
        socket.send(JSON.stringify({
            command: {
                name: "NinaDoSpeechRecognitionAndNLU",
                logSecurity: $('#nlu_nr_sr_logSecurity')[0].value,
                sr_engine: srEngine,
                sr_engine_parameters: {operating_mode:mode},
                sr_audio_file: $('#nlu_nr_srFromFile_url')[0].value, // https://dl.dropboxusercontent.com/s/23knztcspmmrcii/9.%20Famous%20Full%20Obama%20Speech%20on%20Race%20Relations%20-%20A%20More%20Perfect%20Union.mp4
                nlu_engine: "NR"
            }
        }));
        currentCommand = "NinaDoSpeechRecognitionAndNLU_NR_fromAudioFile";
    }
    else {
        socket.send(JSON.stringify({
            command: {
                name: "NinaDoSpeechRecognitionAndNLU",
                logSecurity: $('#nlu_nr_sr_logSecurity')[0].value,
                sr_engine: srEngine,
                sr_engine_parameters: {operating_mode:mode},
                nlu_engine: "NR"
            }
        }));
        currentCommand = "NinaDoSpeechRecognitionAndNLU_NR";
        record();
    }

}

function stopNLUNRRecording() {
    ui_stopNLUNRRecording();
    stopRecording();
}

function startNLUNLERecording() {
    ui_startNLUNLERecording();

    var srEngine = document.getElementById("nlu_nle_sr_engine").value;
    var mode = document.getElementById("nlu_nle_nte_mode").value;

    if ($('#nlu_nle_sr_formURL')[0].checked) {
        socket.send(JSON.stringify({
            command: {
                name: "NinaDoSpeechRecognitionAndNLU",
                logSecurity: $('#nlu_nle_sr_logSecurity')[0].value,
                sr_engine: srEngine,
                sr_engine_parameters: {operating_mode:mode},
                sr_audio_file: $('#nlu_nle_srFromFile_url')[0].value, // https://dl.dropboxusercontent.com/s/23knztcspmmrcii/9.%20Famous%20Full%20Obama%20Speech%20on%20Race%20Relations%20-%20A%20More%20Perfect%20Union.mp4
                nlu_engine: "NLE"
            }
        }));
        currentCommand = "NinaDoSpeechRecognitionAndNLU_NLE_fromAudioFile";
    }
    else {
        socket.send(JSON.stringify({
            command: {
                name: "NinaDoSpeechRecognitionAndNLU",
                logSecurity: $('#nlu_nle_sr_logSecurity')[0].value,
                sr_engine: srEngine,
                sr_engine_parameters: {operating_mode:mode},
                nlu_engine: "NLE"
            }
        }));
        currentCommand = "NinaDoSpeechRecognitionAndNLU_NLE";
        record();
    }
}

function stopNLUNLERecording() {
    ui_stopNLUNLERecording();
    stopRecording();
}

function startDialogNiWRecording() {
    ui_startDialogNIWRecording();

    var srEngine = document.getElementById("dialog_niw_sr_engine").value;
    var mode = document.getElementById("dialog_niw_nte_mode").value;

    if ($('#dialog_niw_sr_formURL')[0].checked) {
        socket.send(JSON.stringify({
            command: {
                name: "NinaDoSpeechRecognitionAndDialog",
                logSecurity: $('#dialog_niw_sr_logSecurity')[0].value,
                sr_engine: srEngine,
                sr_engine_parameters: {operating_mode:mode},
                sr_audio_file: $('#dialog_niw_srFromFile_url')[0].value, // https://dl.dropboxusercontent.com/s/23knztcspmmrcii/9.%20Famous%20Full%20Obama%20Speech%20on%20Race%20Relations%20-%20A%20More%20Perfect%20Union.mp4
                dialog_engine: "NIW"
            }
        }));
        currentCommand = "NinaDoSpeechRecognitionAndDialog_NIW_fromAudioFile";
    }
    else {
        socket.send(JSON.stringify({
            command: {
                name: "NinaDoSpeechRecognitionAndDialog",
                logSecurity: $('#dialog_niw_sr_logSecurity')[0].value,
                sr_engine: srEngine,
                sr_engine_parameters: {operating_mode:mode},
                dialog_engine: "NIW"
            }
        }));
        currentCommand = "NinaDoSpeechRecognitionAndDialog_NIW";
        record();
    }
}

function stopDialogNiwRecording() {
    ui_stopDialogNIWRecording();
    stopRecording();
}

function startDialogNCERecording() {
    ui_startDialogNCERecording();

    var srEngine = document.getElementById("dialog_nce_sr_engine").value;
    var mode = document.getElementById("dialog_nce_nte_mode").value;

    if ($('#dialog_nce_sr_formURL')[0].checked) {
        socket.send(JSON.stringify({
            command: {
                name: "NinaDoSpeechRecognitionAndDialog",
                logSecurity: $('#dialog_nce_sr_logSecurity')[0].value,
                sr_engine: srEngine,
                sr_engine_parameters: {operating_mode:mode},
                sr_audio_file: $('#dialog_nce_srFromFile_url')[0].value, // https://dl.dropboxusercontent.com/s/23knztcspmmrcii/9.%20Famous%20Full%20Obama%20Speech%20on%20Race%20Relations%20-%20A%20More%20Perfect%20Union.mp4
                dialog_engine: "NCE",
                dialog_engine_parameters: {
                    language: "",
                    nleModelURL: $('#dialog_nle_model')[0].value,
                    nleModelName: $('#dialog_nle_model_name')[0].value,
                    nceModelURL: $('#dialog_nce_model')[0].value,
                    nceModelName: $('#dialog_nce_model_name')[0].value
                }
            }
        }));
        currentCommand = "NinaDoSpeechRecognitionAndDialog_NCE_fromAudioFile";
    }
    else {
        socket.send(JSON.stringify({
            command: {
                name: "NinaDoSpeechRecognitionAndDialog",
                logSecurity: $('#dialog_nce_sr_logSecurity')[0].value,
                sr_engine: srEngine,
                sr_engine_parameters: {operating_mode:mode},
                dialog_engine: "NCE",
                dialog_engine_parameters: {
                    language: "",
                    nleModelURL: $('#dialog_nle_model')[0].value,
                    nleModelName: $('#dialog_nle_model_name')[0].value,
                    nceModelURL: $('#dialog_nce_model')[0].value,
                    nceModelName: $('#dialog_nce_model_name')[0].value
                }
            }
        }));
        currentCommand = "NinaDoSpeechRecognitionAndDialog_NCE";
        record();
    }
}

function stopDialogNCERecording() {
    ui_stopDialogNCERecording();
    stopRecording();
}

// Vocal Password functions

function vpStartEnrollRecording() {
    if ($('#vp_user_id').val().trim() === "") {
        $('#vp_results').text("User ID cannot be empty.");
        return;
    }

    ui_VPStartEnrollRecording();

    socket.send(JSON.stringify({
        command: {
            name: "NinaEnrollUser",
            logSecurity: $('#vp_logSecurity')[0].value,
            speakerID: $('#vp_user_id').val()
        }
    }));
    currentCommand = "NinaEnrollUser";

    record();
}

function vpStopEnrollRecording() {
    ui_VPStopEnrollRecording();
    stopRecording();
}

function checkUserEnrollment() {
    if ($('#vp_user_id').val().trim() === "") {
        $('#vp_results').text("User ID cannot be empty.");
        return;
    }

    ui_checkUserEnrollment();

    socket.send(JSON.stringify({
        command: {
            name: "NinaVerifyUserEnrollment",
            logSecurity: $('#vp_logSecurity')[0].value,
            speakerID: $('#vp_user_id').val()
        }
    }));
    currentCommand = "NinaVerifyUserEnrollment";
}

function vpStartAuthenticateRecording() {
    if ($('#vp_user_id').val().trim() === "") {
        $('#vp_results').text("User ID cannot be empty.");
        return;
    }

    ui_VPStartAuthenticateRecording();

    socket.send(JSON.stringify({
        command: {
            name: "NinaAuthenticateUser",
            logSecurity: $('#vp_logSecurity')[0].value,
            speakerID: $('#vp_user_id').val()
        }
    }));
    currentCommand = "NinaAuthenticateUser";

    record();
}

function vpStopAuthenticateRecording() {
    ui_VPStopAuthenticateRecording();
    stopRecording();
}



// Project Vocabulary functions

function projectVocabActivate() {
    if ($('#activate_pv_name').val().trim() === "") {
        $('#config_results').text("Vocabulary name cannot be empty.");
        return;
    }

    socket.send(JSON.stringify({
        command: {
            name: "ActivateProjectVocabulary",
            logSecurity: $('#activate-deactivatePV_logSecurity')[0].value,
            vocabName: $('#activate_pv_name').val(),
            weight: $('#activate_pv_weight')[0].value
        }
    }));
    currentCommand = "ActivateProjectVocabulary";
}

function projectVocabDeactivate() {
    socket.send(JSON.stringify({
        command: {
            name: "DeactivateProjectVocabulary",
            logSecurity: $('#activate-deactivatePV_logSecurity')[0].value
        }
    }));
    currentCommand = "DeactivateProjectVocabulary";
}

function projectVocabGetAll() {
    socket.send(JSON.stringify({
        command: {
            name: "GetAllProjectVocabularies",
            logSecurity: $('#listPV_logSecurity')[0].value
        }
    }));
    currentCommand = "GetAllProjectVocabularies";
}

function projectVocabDelete() {
    if ($('#delete_pv_name').val().trim() === "") {
        $('#config_results').text("Vocabulary name cannot be empty.");
        return;
    }

    socket.send(JSON.stringify({
        command: {
            name: "DeleteProjectVocabulary",
            logSecurity: $('#deletePV_logSecurity')[0].value,
            vocabName: $('#delete_pv_name').val()
        }
    }));
    currentCommand = "DeleteProjectVocabulary";
}

function uploadProjectVocab() {
    if ($('#upload_pv_name').val().trim() === "") {
        $('#config_results').text("Vocabulary name cannot be empty.");
        return;
    }

    var input; // URL, or array of string, or "##fromTrainingModel"
    var type = $('input[name=upload_pv_inputType]:checked').val();
    if (type === "text")
    {
        input = "[";
        var array = $('#upload_pv_text_data').val().split('\n');
        for (i in array) {
            input += "\"" + array[i] + "\",";
        }
        input += "]";
    }
    else if (type === "url")
    {
        var url = $('#upload_pv_url_data').val();
        var dots = url.split(".");
        var extention = ("." + dots[dots.length-1]).toLowerCase();
        if ([".zip", ".txt"].indexOf(extention) === -1)
        {
            $('#config_results').text("skiped "+url+". It must link to a .txt or .zip file.");
            return; // skip this file!
        }
        input = url;
    }
    else if (type === "nes")
    {
        input = "##fromTrainingModel";
    }
    else if (type === "file")
    {
        // var files = $('#upload_pv_file_data')[0].files;
        // var len = 1; // ONE FILE AT A TIME //files.length;
        // for (var i = 0; i < len; i++)
        // {
        //     var file = files[i];
        //     console.log("Filename: " + file.name);
        //     console.log("Type: " + file.type);
        //     console.log("Size: " + file.size + " bytes");

        //     // Check file type.
        //     var dots = file.name.split(".");
        //     var extention = ("." + dots[dots.length-1]).toLowerCase();
        //     if (file.type !== "application/zip" && file.type !== "application/x-zip-compressed" &&
        //         file.type !== "text/plain" && [".zip", ".txt"].indexOf(extention) === -1)
        //     {
        //         $('#config_results').text("skiped "+file.name+". It must be a .txt or .zip file.");
        //         continue; // skip this file!
        //     }

        //     console.log("accepted to upload: "+file.name);
        //     // create a form with a couple of values
        //     var form = new FormData();
        //     form.append("file", file);
        //     // send via XHR
        //     var xhr = new XMLHttpRequest();
        //     xhr.onload = function(event)
        //     {
        //         alert('Uploaded?');
        //     }
        //     xhr.open("post", "https://"+sHost+":"+sPort+"/"+uploadScriptPath, true);
        //     xhr.send(form);
        // }
        // input = "http://"+host+":"+port+"/Websocket/"+NAME;
        $('#config_results').text("TODO: upload file.");
        return;
    }
    else
    {
        $('#config_results').text("This should never happen.");
        return;
    }

    console.log(input);

    socket.send(JSON.stringify({
        command: {
            name: "UploadProjectVocabulary",
            logSecurity: $('#uploadPV_logSecurity')[0].value,
            vocabName: $('#upload_pv_name').val(),
            append: $('#upload_pv_append')[0].checked,
            dataSource: input
        }
    }));
    currentCommand = "UploadProjectVocabulary";
}


// Dynamic Vocabulary functions

function dynamicVocabGetAll() {
    socket.send(JSON.stringify({
        command: {
            name: "GetAllDynamicVocabularies",
            logSecurity: $('#listDV_logSecurity')[0].value
        }
    }));
    currentCommand = "GetAllDynamicVocabularies";
}

function dynamicVocabActivate() {
    if ($('#activate_dv_name').val().trim() === "") {
        $('#config_results').text("Vocabulary name cannot be empty.");
        return;
    }

    socket.send(JSON.stringify({
        command: {
            name: "ActivateDynamicVocabulary",
            logSecurity: $('#activate-deactivateDV_logSecurity')[0].value,
            vocabName: $('#activate_dv_name').val()
        }
    }));
    currentCommand = "ActivateDynamicVocabulary";
}

function dynamicVocabDeactivate() {
    if ($('#activate_dv_name').val().trim() === "") {
        $('#config_results').text("Vocabulary name cannot be empty.");
        return;
    }

    socket.send(JSON.stringify({
        command: {
            name: "DeactivateDynamicVocabulary",
            logSecurity: $('#activate-deactivateDV_logSecurity')[0].value,
            vocabName: $('#activate_dv_name').val()
        }
    }));
    currentCommand = "DeactivateDynamicVocabulary";
}

function uploadDynamicVocab() {
    var name = $('#upload_dv_name')[0].value;
    if (name === "other")
    {
        name = $('#upload_dv_name_other').val();
        if (name === "") {
            $('#config_results').text("Vocabulary name cannot be empty.");
            return;
        }
    }
    console.log(name);

    var input; // URL, or array of string, or json object
    var type = $('input[name=upload_dv_inputType]:checked').val();
    if (type === "array")
    {
        input = "[";
        var array = $("#upload_dv_textArray_data").tagit("assignedTags");
        for (i in array) {
            input += "\"" + array[i] + "\",";
        }
        input += "]";
    }
    else if (type === "object")
    {
        var text = $('#upload_dv_textObject_data').val();
        input = text;
    }
    else if (type === "url")
    {
        var url = $('#upload_dv_url_data').val();
        var dots = url.split(".");
        var extention = ("." + dots[dots.length-1]).toLowerCase();
        if ([".json"].indexOf(extention) === -1)
        {
            $('#config_results').text("skiped "+url+" It must link to a .json file.");
            return; // skip this file!
        }
        input = url;
    }
    else
    {
        $('#config_results').text("This should never happen.");
        return;
    }
    console.log(input);

    socket.send(JSON.stringify({
        command: {
            name: "UploadDynamicVocabulary",
            logSecurity: $('#uploadDV_logSecurity')[0].value,
            vocabName: name,
            dataSource: input
        }
    }));
    currentCommand = "UploadDynamicVocabulary";
}
