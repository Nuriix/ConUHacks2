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

    this.isPlaying = function ()
    {
        return isPlaying;
    };

    this.play = function (audio)
    {
        var def = Q.defer();
        var audioToPlay = new Int16Array(audio);
        var source = context.createBufferSource();
        var audioBuffer = context.createBuffer(1, audioToPlay.length, 8000);
        var channelData = audioBuffer.getChannelData(0);
        for (var i = 0; i < channelData.length; ++i)
        {
            channelData[i] = audioToPlay[i] / 32768.0;
        }
        source.buffer = audioBuffer;
        source.connect(context.destination);
        if (source.start)
        {
            source.start(0);
        } else
        {
            source.noteOn(0);
        }
        isPlaying = true;

        source.onended = function ()
        {
            isPlaying = false;
            def.resolve();
        };
        return def.promise;
    }
}

function AudioRecorder(audioContext)
{
    var recorder = this;
    var context = audioContext;
    if (!context)
    {
        throw "Need an audio context";
    }
    var def = undefined;
    //var bufferSize = 2048;
    var desiredSampleRate = 8000; // 16k up to server
    var bytesRecorded = 0;
    var audioInput;
    var analyserNode;
    var recordingNode;
    //var channelData = [];
    var recording = false;

    var resampler = new Resampler(context.sampleRate, desiredSampleRate, 1, 8192);

    this.start = function ()
    {
        console.log("context.sampleRate = " + context.sampleRate);
        if (def !== undefined) return def;

        def = Q.defer();

        navigator.getUserMedia(
            {audio: true},
            function (stream)
            {
                audioInput = context.createMediaStreamSource(stream); //
                analyserNode = context.createAnalyser();
                recordingNode = context.createScriptProcessor(8192, 1, 2);
                recordingNode.onaudioprocess = function onaudioprocess(evt)
                {
                    var ch = resampler.resampler(evt.inputBuffer.getChannelData(0));

                    bytesRecorded += ch.length;
                    var ampArray = new Uint8Array(analyserNode.frequencyBinCount);
                    analyserNode.getByteTimeDomainData(ampArray);

                    var encodedSpx = new Int16Array(ch.length);
                    for (var i = 0; i < ch.length; ++i) {
                        var s = Math.max(-1, Math.min(1, ch[i]));
                        encodedSpx[i] = s <= -1.0 ? 0x8000 : (s >= 1.0 ? 0x7FFF : s * 0x8000);
                        //encodedSpx[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                    }

                    def.notify([encodedSpx, ampArray]);
                };
                audioInput.connect(analyserNode);
                analyserNode.connect(recordingNode);
                recordingNode.connect(context.destination);
                def.notify('Started listening');
            },
            def.reject);


        return def.promise;
    };

    this.reset = function ()
    {
        //channelData.length = 0;
        bytesRecorded = 0;
    };

    this.stop = function ()
    {
        //var ret = channelData;
        //channelData.length = 0;
        console.log('captured ' + bytesRecorded + ' bytes');
        bytesRecorded = 0;
        def.resolve();
    };
}