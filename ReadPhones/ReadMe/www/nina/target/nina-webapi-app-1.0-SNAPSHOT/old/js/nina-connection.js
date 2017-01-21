function NinaConnection()
{
    var ninaSocket = undefined;
    var def = undefined;
    var connectionData;

    var currentDefer = undefined;

    function onOpen(evt)
    {
        ninaSocket.sendJSON({connect: connectionData});
        def.notify(evt);
    }

    function onError(evt)
    {
        def.reject(evt);
    }

    function onClose(evt)
    {
        console.log("nina-connection onClose");
        def.resolve(evt);
        ninaSocket = undefined;
        def = undefined;
    }

    function reject(response)
    {
        const tmp = currentDefer;
        currentDefer = undefined;
        if (tmp) tmp.reject(response);
    }

    function resolve(response)
    {
        const tmp = currentDefer;
        currentDefer = undefined;
        if (tmp) tmp.resolve(response);
    }

    function notify(response)
    {
        //console.log("response = " + JSON.stringify(response,null,2));
        const tmp = currentDefer;
        if (tmp) tmp.notify(response);
    }


    function msgHandler(msg)
    {
        var response;

        if (isOfType("ArrayBuffer", msg))
        {
            notify(msg);
            return;
        }

        try
        {
            response = JSON.parse(msg);
        }
        catch (e)
        {
            console.log("Error parsing message: " + msg);
            reject(msg);
            return;
        }

        console.log(response);

        if (response.QueryRetry)
        {
            resolve(response);
        }

        else if (response.QueryError)
        {
            reject(response);
        }
        else if (response.QueryResult)
        {
            var queryResult = response.QueryResult;
            var mrec_results = queryResult.mrec_results;
            if (mrec_results && mrec_results.final_response === 0)
            {
                notify(response);
            }
            else
            {
                resolve(response);
            }
        }
        else if (response.ControlData)
        {
            notify(response);
        }
        else if (response.TalkAgentResponse)
        {
            localStorage.lastResponse = JSON.stringify(response['TalkAgentResponse']);
            $("#save_dialog_button").removeClass("disabled");
            $("#load_dialog_button").removeClass("disabled");

            results(response['TalkAgentResponse']['Display']['OutText']['#text']);
            var s = (response['TalkAgentResponse']['Display']['OutText']['#text']).replace(/\r?\n|\r/g, '');
            var sentence = removeSpecialChars(removeMarkup(removeLinks(s)));
            requestTTS(sentence);
        }
        else if (response.varolii)
        {
            resolve(response.varolii);
        }
        else if (response.VocalPassword)
        {
            resolve(response.VocalPassword);
        }
        else
        {
            reject(response);
        }
    }


    function results(str)
    {
        var $results = $("#results");
        $results.append(str);
        $results.append("<br/>");
        $results.scrollTop($results[0].scrollHeight);
    }

    function requestTTS(message)
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


    this.connect = function (uri, _connectionData)
    {
        if (!uri)
        {
            throw "Need a URI";
        }

        if (!_connectionData)
        {
            throw "Need connection data";
        }

        ["nmsp", "nmaid", "nmaidKey", "uid", "scriptVersion", "dictationLanguage", "phoneModel"].
            forEach(
            function (key)
            {
                if (!_connectionData[key]) throw "Missing " + key + " from connectionData";
            }
        );

        connectionData = _connectionData;

        if (!def)
        {
            def = Q.defer();
            ninaSocket = new Socket(uri, msgHandler);
            ninaSocket.connect().then(onClose, onError, onOpen);
        }
        return def.promise;
    };

    this.disconnect = function ()
    {
        console.log("nina-connection.disconnect");
        if (ninaSocket)
        {
            ninaSocket.disconnect();
        }
    };

    this.createCommand = function (cmdName, optionalKeys)
    {
        var cmd = new NinaCommand(cmdName);
        log("Sending command " + cmdName);
        console.log("Sending command " + cmdName + ", object:");
        console.log(optionalKeys);
        ninaSocket.sendJSON(
            {
                command: {
                    name: cmdName,
                    optionalKeys: optionalKeys
                }
            });
        return cmd;
    };

    function NinaCommand(cmdName)
    {

        var def = Q.defer();
        var command = this;

        if (!cmdName)
        {
            throw "Can't create NinaCommand without a name";
        }

        currentDefer = def;

        function sendData(name, type, value)
        {
            console.log("Sending parameter name:"+name+", type:"+type+", value:object");
            console.log(value);
            ninaSocket.sendJSON({parameter: {name: name, type: type, value: value}});
            return command;
        }

        this.sendTextParameter = function (name, value)
        {
            return sendData(name, "text", value);
        };

        this.sendDictionaryParameter = function (name, value)
        {
            return sendData(name, "dictionary", value);
        };

        this.sendTTSParameter = function (name, value)
        {
            return sendData(name, "tts", value);
        };

        this.sendAudioParameter = function (name, value)
        {
            return sendData(name, "audio", value || {});
        };

        this.sendAudio = function (data)
        {
            return ninaSocket.send(data);
        };

        this.promise = function ()
        {
            return def.promise;
        };

        this.endCommand = function ()
        {
            ninaSocket.sendJSON({endCommand: {}});
            return def.promise;
        }

    }
}

