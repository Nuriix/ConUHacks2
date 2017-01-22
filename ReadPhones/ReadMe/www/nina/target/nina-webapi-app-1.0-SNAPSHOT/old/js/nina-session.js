function NinaSession() {
    var ninaConnection = undefined;
    var def = undefined;
    var request_id = 0;
    var uid;
    var jsessionid = undefined;

    function makeOptionalKeys() {
        var keys = {
            request_id: (++request_id).toString(),
            application: cloudName,
            uid: uid,
            phone_OS: "js"
        };
        if (jsessionid) {
            keys.jsessionid = jsessionid;
        }
        return keys;
    }

    function onOpen(evt) {
        def.notify(evt);
    }

    function onError(evt) {
        def.reject(evt);
    }

    function onClose(evt) {
        def.resolve(evt);
        ninaConnection = undefined;
        def = undefined;
    }

    this.connect = function (uri, connectionData) {
        if (!def) {
            def = Q.defer();
            ninaConnection = new NinaConnection();
            ninaConnection.connect(uri, connectionData).then(onClose, onError, onOpen);
            uid = connectionData.uid;
        }
        return def.promise;
    };

    this.startSession = function (dialogModelDNA, cloudConfigurationDNA, locale) {
        var dialogModelSHA1 = sha1(dialogModelDNA);
        var cloudConfigurationSHA1 = sha1(cloudConfigurationDNA);
        var cmd = ninaConnection.createCommand("NINA_START_SESSION_CMD", makeOptionalKeys());

        var body = {
            dialogModelSHA1: dialogModelSHA1,
            cloudConfigurationSHA1: cloudConfigurationSHA1,
            locale: locale || "en"
        };

        cmd.sendTextParameter("BODY", JSON.stringify(body));

        function startSessionWithDialogModel(response) {

            if (!response.QueryResult)
                return response;

            jsessionid = response.QueryResult.jsessionid;
            var adk_result = response.QueryResult.adk_result;

            if (adk_result.Response.applicationfound)
                return response;

            var body = {
                dialogModelDNA: dialogModelDNA,
                cloudConfigurationDNA: cloudConfigurationDNA,
                dialogModelSHA1: dialogModelSHA1,
                cloudConfigurationSHA1: cloudConfigurationSHA1,
                locale: locale || "en"
            };

            var cmd = ninaConnection.createCommand("NINA_START_SESSION_WITH_DIALOG_MODEL_CMD", makeOptionalKeys());
            cmd.sendTextParameter("BODY", JSON.stringify(body));
            return cmd.endCommand();
        }


        return cmd.endCommand().then(startSessionWithDialogModel);
    };

    this.endSession = function () {

        function disconnect(evt) {
            if (def) {
                ninaConnection.disconnect();
            }
            return evt;
        }

        return ninaConnection.createCommand("NINA_END_SESSION_CMD", makeOptionalKeys()).endCommand().finally(disconnect);
    };

    this.nlu = function (text, request_info) {
        var cmd = ninaConnection.createCommand("NINA_NLU_NR_CMD", makeOptionalKeys());
        cmd.sendTextParameter("BODY", text);
        cmd.sendDictionaryParameter("REQUEST_INFO", request_info);
        return cmd.endCommand();
    };

    this.nle = function(nleSpecs) {
        var cmd = ninaConnection.createCommand("NINA_NLE_CMD", makeOptionalKeys());
        cmd.sendDictionaryParameter("NLE", nleSpecs);
        return cmd.endCommand();
    };

    this.tts = function (input, type, voice, language) {
        var optionalKeys = makeOptionalKeys();
        optionalKeys.tts_voice = voice;
        optionalKeys.tts_language = language;
        var cmd = ninaConnection.createCommand("NINA_TTS_CMD", optionalKeys);

        var txtToRead = {
            tts_input: input,
            tts_type: type
        };
        cmd.sendTTSParameter("TEXT_TO_READ", txtToRead);
        return cmd.endCommand();
    };

    this.dialog = function(input, expertMode, url, sessionBootstrap){
        var optionalKeys = makeOptionalKeys();
        var cmd = ninaConnection.createCommand("NINA_DIALOG_CMD", optionalKeys);
        var param = {
            input: input,
            expertMode: expertMode ? true : false,
            url: url,
            sessionBootstrap: sessionBootstrap
        };
        cmd.sendDictionaryParameter("BODY", param);
        return cmd.endCommand();
    };

    this.varolii = function(text, clientId, mode, personId){
        var optionalKeys = makeOptionalKeys();
        var cmd = ninaConnection.createCommand("NINA_VAROLII_CMD", optionalKeys);
        var param = {
            value: text,
            client: clientId,
            mode: mode,
            person: personId
        };
        cmd.sendDictionaryParameter("BODY", param);
        return cmd.endCommand();
    };

    this.audioDialog = function(parameters) {
        var optionalKeys = makeOptionalKeys();
        optionalKeys.dictation_type = "dictation";
        parameters = parameters || {};

        var request_info = parameters.request_info || {};
        if (!request_info.text) request_info.text = '';
        if (!request_info.start) request_info.start = 0;
        if (!request_info.end) request_info.end = 0;

        var cmd = ninaConnection.createCommand("NINA_AUDIO_DIALOG_CMD", optionalKeys);
        var param = {
            url: urlDialog
        };
        cmd.sendDictionaryParameter("BODY", param);
        cmd.sendDictionaryParameter("REQUEST_INFO", request_info);
        cmd.sendAudioParameter("AUDIO_INFO", parameters.endPointerConfig);
        return cmd;
    };

    this.dictation = function(parameters) {
        var optionalKeys = makeOptionalKeys();
        optionalKeys.dictation_type = "dictation";
        parameters = parameters || {};

        var request_info = parameters.request_info || {};
        if (!request_info.text) request_info.text = '';
        if (!request_info.start) request_info.start = 0;
        if (!request_info.end) request_info.end = 0;

        var cmd = ninaConnection.createCommand("NINA_MREC_CMD", optionalKeys);
        cmd.sendDictionaryParameter("REQUEST_INFO", request_info);
        cmd.sendAudioParameter("AUDIO_INFO", parameters.endPointerConfig);
        return cmd;
    };

    this.vocalPassword = function(mode, endPointerConfig) {
        var optionalKeys = makeOptionalKeys();
        var cmd = ninaConnection.createCommand("VOCAL_PASSWORD_CMD", optionalKeys);

        var param = {
            mode: mode,
            speakerID: speakerID
        };

        cmd.sendDictionaryParameter("BODY", param);

        if (mode == "ENROLL" || mode == "VERIFY") {
            cmd.sendAudioParameter("AUDIO_INFO", endPointerConfig);
        }

        return cmd;
    };
}

