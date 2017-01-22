var recording = false;
function animation()
{
    if (recording)
    {
        $("#logo").addClass("logo-glow");
    } else
    {
        $("#logo").css("background-color", "black");
        $("#logo").removeClass("logo-glow");
    }
}
function record()
{
    if (expertModeEnabled)
    {
        expertModeEnabled = false;
        $("#expert_mode_button").html("Expert Mode");
    }

    if (recording)
    {
        recording = false;
        if (!isRecording)
            return;


        shouldRecord = false;
        log('Stopped recording.');
        animation();
    }
    else
    {
        recording = true;
        if (isRecording)
        {
            return;
        }
        asr("text_to_send");
        log('Recording...');
        animation();
    }
}


var expertModeEnabled = false;

function expertMode()
{
    if (expertModeEnabled)
    {
        $("#expert_mode_button").html("Expert Mode");
        $("#text_to_send").val("");
    } else
    {

        var text_to_send = $("#text_to_send");

        $("#expert_mode_button").html("Normal Mode");

        var ninaVars =
        {
            TalkAgentRequest: {
                "@xmlns": "http://www.virtuoz.com",
                "@SCI": "",
                "@IID": "",
                "@TimeStamp": "2014-10-23T22:46:42.996-04:00",
                UserText: $("#text_to_send").val().trim(),
                Debug: {},
                uiID: 1929446423053.0916,
                ClientMetaData: {
                    chatReferrer: "",
                    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.104 Safari/537.36"
                },
                VisitorIsTyping: true,
                NinaVars: {
                    preprod: true,
                    ninachat: true
                }

            }
        };

        text_to_send.val("TalkAgentRequest=" + JSON.stringify(ninaVars, null, 3) + "&rnd=2144811317653.2346");
    }

    textChanged("text_to_send", "request_dialog_button");

    expertModeEnabled = !expertModeEnabled;
}


function requestTTSdialog(message)
{

    var tts_language = defaultLanguage;
    var tts_voice = defaultVoice;
    var tts_input = message;
    var tts_type = "text";

    if (expertModeEnabled)
    {
        var body = JSON.parse(input);
        tts_input = body.tts_input;
        if (body.tts_voice) tts_voice = body.tts_voice;
        if (body.tts_language) tts_language = body.tts_language;
        if (body.tts_type) tts_type = body.tts_type;
    }
    ninaSession.tts(tts_input, tts_type, tts_voice, tts_language).then(onSuccess, onError, onData)

}

function resultsDialog(str)
{
    console.log(str);
    var $results = $("#results");
    $results.append(str);
    $results.append("<br/>");
    $results.scrollTop($results[0].scrollHeight);
}

function onSuccess(response)
{
    if (response.QueryRetry)
    {
        log("Received QueryRetry: " + JSON.stringify(response, null, 3));
    }
    else if (!response.QueryResult)
    {
        log("Unexpected response: " + JSON.stringify(response, null, 3));
    }
    else
    {
        log("TTS completed successfully");
    }
}
function onError(response)
{
    if (response.QueryError)
    {
        log("Received QueryError: " + JSON.stringify(response, null, 3));
    }
    else
    {
        log("Unexpected error: " + JSON.stringify(response, null, 3));
    }
}

function onData(response)
{
    if (isOfType("ArrayBuffer", response))
    {
        log("Received " + response.byteLength + " bytes of audio data.");
        audioSink.play(response).then(function ()
        {
            log("and sent to the audio system.")
        });
    }
    else if (!response.QueryResult)
    {
        log("Unexpected response: " + JSON.stringify(response, null, 3));
    }
    else if (response.QueryResult.final_response == 0)
    {
        log("Received intermediate results: " + JSON.stringify(response, null, 3));
    }
    else
    {
        log("Unexpected QueryResult final response: " + JSON.stringify(response, null, 3));
    }
}

//Websocket method for Dialog
function requestDIALOG()
{
    if (!$("#request_dialog_button").hasClass("disabled"))
    {
        var sessionBootstrap = null;
        if (localStorage.responseToSend != null) {
            sessionBootstrap = localStorage.responseToSend;
            localStorage.removeItem("responseToSend");
        }

        var text_to_interpret = fixLineBreaks($("#text_to_send").val());
        ninaSession.dialog(text_to_interpret, expertModeEnabled, urlDialog, sessionBootstrap);

        //$("#text_to_send").val("");
        //$("#request_dialog_button").addClass("disabled");
    }
}

function saveDIALOG()
{
    if (!$("#save_dialog_button").hasClass("disabled"))
    {
        localStorage.savedResponse = localStorage.lastResponse;
    }
}

function loadDIALOG()
{
    if (!$("#load_dialog_button").hasClass("disabled"))
    {
        var savedResponse = JSON.parse(localStorage.savedResponse);

        localStorage.responseToSend = JSON.stringify(savedResponse.sessionBootstrap);

        $("#results").html(savedResponse['Display']['OutText']['#text'] + "<br>");

        requestTTSdialog(savedResponse['Display']['AlternateOutText']['#text']);
    }
}

function removeLinks(str)
{
    return str.replace(/<a(?:.*\>).*<\/a>[ \t]*$/, '');
}

function removeMarkup(str)
{
    return str.replace(/<\/?[^>]+(>|$)/g, '').replace(/\r?\n|\r/g, ' ');
}

function removeSpecialChars(str)
{
    return str.replace(/&nbsp;/g, ' ');
}


$(document).ready(function ()
{

    const $recordButton = $("#record_button");
    const $stopButton = $("#stop_button");

    if (localStorage.savedResponse) {
        $("#save_dialog_button").removeClass("disabled");
        $("#load_dialog_button").removeClass("disabled");
    }

    $(document).on('click', '#results ul li a', function (e)
    {
        if (expertModeEnabled)
        {
            $('#text_to_send').val($(this).html());
            expertMode();
            $('#text_to_send').val($(this).html());
            $("#request_dialog_button").removeClass("disabled");
        }
        else
        {
            $('#text_to_send').val($(this).html());
            $("#request_dialog_button").removeClass("disabled");
        }
        requestDIALOG();
    });


    try
    {

        audio_context = initAudioContext();
        log('Audio context set up.');
        log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));

        if (!navigator.getUserMedia)
        {
            $recordButton.addClass("disabled");
        }
    } catch (e)
    {
        $recordButton.addClass("disabled");
        alert('No web audio support in this browser!');
    }

});


function printDictationResultsAudioDialog(message)
{

    if (message.ControlData)
    {
        console.log("Received control-data");
        record();
    }
    else if (message.QueryResult && message.QueryResult.mrec_results)
    {
        var mrec_results = message.QueryResult.mrec_results;
        var transcription = mrec_results.transcriptions[0];
        var confidence = mrec_results.confidences[0];
        var final_response = mrec_results.final_response;
        if (final_response === 1)
        {
            log("Dictation results: '" + transcription + "', confidence=" + confidence);
            textChanged("text_to_send", "request_dialog_button");
        }
        $("#text_to_send").val(transcription);
    }
    else
    {
        logResponse(message);
        results(message.QueryRetry.prompt);
        requestTTSdialog(message.QueryRetry.prompt);
    }
}

      