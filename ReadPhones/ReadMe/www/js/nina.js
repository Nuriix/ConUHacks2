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
		
        socket.send(JSON.stringify({
            command: {
                name: "NinaStartSession",
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
                        audioPlayer.stop(); // stop the TTS
                    }
                    else alert(JSON.stringify(response));
                }
                else alert(JSON.stringify(response));
            }
            else if (response.QueryResult)
            {
                if (response.QueryResult.result_type === "NinaStartSession") {
                    
                    currentCommand = null;
                }
                else if (response.QueryResult.result_type === "NinaEndSession") {
                    
                    currentCommand = null;
                    socket.close();
                    socket = undefined;
                }
                else if (response.QueryResult.result_type === "NinaGetLogs") {
                    for (i in response.QueryResult.results) {
                        var obj = response.QueryResult.results[i];
                        ui_gotLog(Object.keys(obj)[0], obj[Object.keys(obj)[0]]);
                    }
                    currentCommand = null;
                }
                else if ($.inArray(response.QueryResult.result_type, ["NinaDoMREC", "NinaDoNTE", "NinaDoNR"]) >= 0 ) {
                    if (currentCommand == "NinaDoSpeechRecognition_fromAudioFile" && response.QueryResult.final_response) {
                       
                        currentCommand = null;
                    }
                }
                else if (response.QueryResult.result_type === "NinaDoMRECAndNLU_NR" ||
                        response.QueryResult.result_type === "NinaDoNTEAndNLU_NR" ||
                        response.QueryResult.result_type === "NinaDoNRAndNLU_NR" ||
                        response.QueryResult.result_type === "NinaDoNLU_NR") {
                    if (response.QueryResult.final_response) {
                        currentCommand = null;
                    }                }
                else if (response.QueryResult.result_type === "NinaDoMRECAndNLU_NLE" ||
                        response.QueryResult.result_type === "NinaDoNTEAndNLU_NLE" ||
                        response.QueryResult.result_type === "NinaDoNRAndNLU_NLE" ||
                        response.QueryResult.result_type === "NinaDoNLU_NLE") {
                    if (response.QueryResult.final_response) {
                        currentCommand = null;
                    }
                }
                else if (response.QueryResult.result_type === "NinaDoDialog_NIW" ||
                        response.QueryResult.result_type === "NinaDoMRECAndDialog_NIW" ||
                        response.QueryResult.result_type === "NinaDoNTEAndDialog_NIW" ||
                        response.QueryResult.result_type === "NinaDoNRAndDialog_NIW") {
                    if (response.QueryResult.final_response) {
                        currentCommand = null;
                    }
                }
                else if (response.QueryResult.result_type === "NinaDoDialog_NCE" ||
                        response.QueryResult.result_type === "NinaDoMRECAndDialog_NCE" ||
                        response.QueryResult.result_type === "NinaDoNTEAndDialog_NCE" ||
                        response.QueryResult.result_type === "NinaDoNRAndDialog_NCE") {
                    if (response.QueryResult.final_response) {
                        currentCommand = null;
                    }
                }
                // Project Vocabulary responses:
                else if (response.QueryResult.result_type === "ActivateProjectVocabulary") {
                    
                    currentCommand = null;
                }
                else if (response.QueryResult.result_type === "DeactivateProjectVocabulary") {
                  
                    currentCommand = null;
                }
                else if (response.QueryResult.result_type === "GetAllProjectVocabularies" ||
                        response.QueryResult.result_type === "DeleteProjectVocabulary") {
                    currentCommand = null;
                }
                // Dynamic Vocabulary responses:
                else if (response.QueryResult.result_type === "ActivateDynamicVocabulary" ||
                        response.QueryResult.result_type === "DeactivateDynamicVocabulary" ||
                        response.QueryResult.result_type === "GetAllDynamicVocabularies" ||
                        response.QueryResult.result_type === "UploadDynamicVocabulary") {
                    currentCommand = null;
                }
                // Business Logic functions:
                else if (response.QueryResult.result_type === "NinaDoBusinessLogic"){
                    currentCommand = null;
                }
                else if (response.QueryResult.result_type === "NinaBLEStatus"){
                    currentCommand = null;
                }
                else if (response.QueryResult.result_type === "NinaUploadBusinessLogic"){
                    currentCommand = null;
                }
                else alert(JSON.stringify(response));
            }
            else if (response.VocalPassword)
            {

                var vpResponse = response.VocalPassword;
			
				currentCommand = null;
			
            }
            else if (response.QueryRetry)
            {
                if (response.QueryRetry.result_type === "NinaPlayAudioWithBargeIn") {
                    if (audioRecorder != undefined) stopRecording();
                    if (response.QueryRetry.final_response) {
                        currentCommand = null;
                    }
                }
                else if (response.QueryRetry.result_type === "NinaDoDialog_NIW" ||
                        response.QueryRetry.result_type === "NinaDoMRECAndDialog_NIW" ||
                        response.QueryRetry.result_type === "NinaDoNTEAndDialog_NIW" ||
                        response.QueryRetry.result_type === "NinaDoNRAndDialog_NIW" ||
                        response.QueryRetry.result_type === "NinaDoSpeechRecognitionAndDialog_NIW") {
                    currentCommand = null;
                }
                else if (response.QueryRetry.result_type === "NinaDoDialog_NCE" ||
                        response.QueryRetry.result_type === "NinaDoMRECAndDialog_NCE" ||
                        response.QueryRetry.result_type === "NinaDoNTEAndDialog_NCE" ||
                        response.QueryRetry.result_type === "NinaDoNRAndDialog_NCE" ||
                        response.QueryRetry.result_type === "NinaDoSpeechRecognitionAndDialog_NCE") {
                    currentCommand = null;
                }
                else if (response.QueryRetry.result_type === "NinaDoNLU_NR" ||
                        response.QueryRetry.result_type === "NinaDoMRECAndNLU_NR" ||
                        response.QueryRetry.result_type === "NinaDoNTEAndNLU_NR" ||
                        response.QueryRetry.result_type === "NinaDoNRAndNLU_NR" ||
                        response.QueryRetry.result_type === "NinaDoSpeechRecognitionAndNLU_NR") {
                    currentCommand = null;
                }
                else if (response.QueryRetry.result_type === "NinaDoNLU_NLE" ||
                        response.QueryRetry.result_type === "NinaDoMRECAndNLU_NLE" ||
                        response.QueryRetry.result_type === "NinaDoNTEAndNLU_NLE" ||
                        response.QueryRetry.result_type === "NinaDoNRAndNLU_NLE" ||
                        response.QueryRetry.result_type === "NinaDoSpeechRecognitionAndNLU_NLE") {
                    if (currentCommand == "NinaDoSpeechRecognitionAndNLU_NLE_fromAudioFile") {
                    currentCommand = null;
                }
                else if (response.QueryRetry.result_type === "ActivateProjectVocabulary" ||
                        response.QueryRetry.result_type === "DeleteProjectVocabulary" ||
                        response.QueryRetry.result_type === "UploadProjectVocabulary" ||
                        response.QueryRetry.result_type === "ActivateDynamicVocabulary" ||
                        response.QueryRetry.result_type === "DeactivateDynamicVocabulary" ||
                        response.QueryRetry.result_type === "UploadDynamicVocabulary") {
                    currentCommand = null;
                }
                else if (response.QueryRetry.result_type === "NinaDoBusinessLogic"){
                    currentCommand = null;
                }
                else if (response.QueryRetry.result_type === "NinaBLEStatus"){
                    currentCommand = null;
                }
                else if (response.QueryRetry.result_type === "NinaUploadBusinessLogic"){
                    currentCommand = null;
                }
                else alert(JSON.stringify(response));
            }
            else alert(JSON.stringify(response));
			}
        }
    };
}

function startSession() {

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

    defaultAgent = "";
    
    socket.send(JSON.stringify({
        command: {
            name: "NinaEndSession"
        }
    }));
    currentCommand = "NinaEndSession";
}

function playAudio(stringyThing) {
	var inputText = fixLineBreaks(stringyThing);

	socket.send(JSON.stringify({
		command: {
			name: "NinaPlayAudio",
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



function initAudioContext()
{
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext)
    {
        throw "No WebAudio Support in this Browser";
    }
    navigator.getUserMedia = navigator.getUserMedia
            || navigator.webkitGetUserMedia
            || navigator.mozGetUserMedia
            || navigator.msGetUserMedia;
    if (!navigator.getUserMedia)
    {
        console.log("No getUserMedia Support in this Browser");
    }
    return new AudioContext();
}

function AudioPlayer(audioContext)
{
    var isPlaying = false;
    var context = audioContext;
    var source = null;

    this.isPlaying = function ()
    {
        return isPlaying;
    };

    this.play = function (audio)
    {
        var audioToPlay = new Int16Array(audio);
        source = context.createBufferSource();
        var audioBuffer = context.createBuffer(1, audioToPlay.length, 8000);
        var channelData = audioBuffer.getChannelData(0);
        for (var i = 0; i < channelData.length; ++i)
        {
            channelData[i] = audioToPlay[i] / 32768.0;
        }
        source.buffer = audioBuffer;
        source.connect(context.destination);
        if (source.start) {
            source.start(0);
        }
        else {
            source.noteOn(0);
        }
        isPlaying = true;

        source.onended = function ()
        {
            isPlaying = false;
        };
    };

    this.stop = function ()
    {
        if (source != null) {
            source.stop();
            isPlaying = false;
        }
    }
}


/*
 *  The audio recorder uses promises (deferred object) from the Q.js library
 */
function AudioRecorder(audioContext)
{
    var context = audioContext;
    var mediaStream;
    var def;
    
    var desiredSampleRate = 8000;
    var audioInput;
    var analyserNode;
    var recordingNode;
    
    var resampler = new Resampler(context.sampleRate, desiredSampleRate, 1, 8192);

    this.start = function () {
        def = Q.defer();

        console.log("context.sampleRate = " + context.sampleRate);
        
        navigator.getUserMedia(
                
                {audio: true},
        
                function (stream) {
                    mediaStream = stream;
                    
                    audioInput = context.createMediaStreamSource(stream);
                    analyserNode = context.createAnalyser();
                    recordingNode = context.createScriptProcessor(8192, 1, 2);
                    recordingNode.onaudioprocess = function (evt) {

                        var ch = resampler.resampler(evt.inputBuffer.getChannelData(0));

                        var ampArray = new Uint8Array(analyserNode.frequencyBinCount);
                        analyserNode.getByteTimeDomainData(ampArray);

                        var encodedSpx = new Int16Array(ch.length);
                        for (var i = 0; i < ch.length; ++i) {
                            var s = Math.max(-1, Math.min(1, ch[i]));
                            encodedSpx[i] = s <= -1.0 ? 0x8000 : (s >= 1.0 ? 0x7FFF : s * 0x8000);
                        }

                        def.notify([encodedSpx, ampArray]);
                    };

                    audioInput.connect(analyserNode);
                    analyserNode.connect(recordingNode);
                    recordingNode.connect(context.destination);
                },
                
                def.reject);

        return def.promise;
    };

    this.stop = function () {
        mediaStream.getTracks().forEach(function (track) {
            track.stop();
        });

        def.resolve();
    };
}

function isOfType(type, obj) {
    if (obj === undefined || obj === null)
        return false;

    return type === Object.prototype.toString.call(obj).slice(8, -1);
}

function fixLineBreaks(string) {
    var replaceWith = '\r\n';

    if (string.indexOf('\r\n') > -1) {  	// Windows encodes returns as \r\n
        // Good nothing to do
    } else if (string.indexOf('\n') > -1) { 	// Unix encodes returns as \n
        string = replaceAll(string, '\n', replaceWith);
    } else if (string.indexOf('\r') > -1) { 	// Macintosh encodes returns as \r
        string = replaceAll(string, '\r', replaceWith);
    }
    return string;
}