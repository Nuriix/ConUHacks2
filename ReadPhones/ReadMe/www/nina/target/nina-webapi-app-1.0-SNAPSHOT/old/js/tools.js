function url(s) {

    //return "ws://localhost:8025/nina";

    var l = window.location;
    var protocol;
    var default_port;

    if (l.protocol === "https:") {
        protocol = "wss";
        default_port = 443;
    }
    else {
        protocol = "ws";
        default_port = 80;
    }

    var path = l.pathname;
    var idx = path.lastIndexOf('/');
    if (idx > 0) {
        path = path.substring(0, idx + 1);
    }
    else {
        path += "/";
    }

    return protocol + "://" + l.hostname + (l.port != default_port ? ":" + l.port : "") + path + s;
}

function replaceAll(string, find, replace) {
    return string.replace(new RegExp(find, 'g'), replace);
}

function textChanged(inputId, buttonId) {
    inputId = "#" + inputId;
    buttonId = "#" + buttonId;
    if ($(inputId).val().trim() === "") {
        $(buttonId).addClass("disabled");
    } else {
        $(buttonId).removeClass("disabled");
    }
}

function asr(inputId) {

    var sent = 0;
    var cmd = undefined;

    shouldRecord = true;

    isRecording = true;

    var recorder = new AudioRecorder(audio_context);

    if (!cmd) {
        const dictationParameters = {
            request_info: {
                send_intermediate_responses: "true"
            }
        };

        dictationParameters.endPointerConfig = endPointerConfig;

        if (inputId == "dictation_results") {
            cmd = ninaSession.dictation(dictationParameters);
            cmd.promise().then(printDictationResults, logError, printDictationResults);
        } else if (inputId == "ENROLL" || inputId == "VERIFY") {
            cmd = ninaSession.vocalPassword(inputId, endPointerConfig);
            cmd.promise().then(resultsVP, logError, resultsVP);
        } else {
            cmd = ninaSession.audioDialog(dictationParameters);
            cmd.promise().then(printDictationResultsAudioDialog, logError, printDictationResultsAudioDialog);
        }
    }
    $(inputId).val("");
    recorder.start().then(
        function () {
            isRecording = false;
            log("recording completed");
            log("Sent " + sent + " bytes to MREC.");
            cmd.endCommand();
            cmd = undefined;
        },
        function () {
            isRecording = false;
            log("recording failed");
        },
        function (data) {

            var typ = typeof data;
            switch (typ) {
                case "string":
                default:
                    log(data);
                    break;

                case 'object': // tuple, resampled audio as Int16Array and Uint8Array of amplitude data
                    var frames = data[0]; // Int16Array
                    sent += cmd.sendAudio(frames.buffer);
                    break;
            }

            if (!shouldRecord) {
                recorder.stop();
            }
        }
    );
}
function fixLineBreaks(string) {
    var replaceWith = '\r\n';

    if (string.indexOf('\r\n') > -1) {  		// Windows encodes returns as \r\n
        // Good nothing to do
    } else if (string.indexOf('\n') > -1) { 	// Unix encodes returns as \n
        string = replaceAll(string, '\n', replaceWith)
    } else if (string.indexOf('\r') > -1) { 	// Macintosh encodes returns as \r
        string = replaceAll(string, '\r', replaceWith)
    }

    return string;
}

function log(str) {
    var $log = $("#log");
    var d = new Date();
    //$log.append('<div><em>' + d + '</em> &nbsp; ' + str + '</div>');
    $log.append(d.toString() + " => " + str + "<br>");
    $log.scrollTop($log[0].scrollHeight);
}

function clearLog() {
    $("#log").html("");
}

function supports_html5_storage() {
    try {
        return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
        return false;
    }
}

function stringFromFile(filePath) {
    //console.log("reading file: " + filePath);
    var request = new XMLHttpRequest();
    request.open("GET", filePath, false);
    request.send(null);

    return request.responseText;
}

function sha1(str) {
    //  discuss at: http://phpjs.org/functions/sha1/
    // original by: Webtoolkit.info (http://www.webtoolkit.info/)
    // improved by: Michael White (http://getsprink.com)
    // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    //    input by: Brett Zamir (http://brett-zamir.me)
    //  depends on: utf8_encode
    //   example 1: sha1('Kevin van Zonneveld');
    //   returns 1: '54916d2e62f65b3afa6e192e6a601cdbe5cb5897'

    var rotate_left = function (n, s) {
        var t4 = (n << s) | (n >>> (32 - s));
        return t4;
    };

    var cvt_hex = function (val) {
        var str = '';
        var i;
        var v;

        for (i = 7; i >= 0; i--) {
            v = (val >>> (i * 4)) & 0x0f;
            str += v.toString(16);
        }
        return str;
    };

    var blockstart;
    var i, j;
    var W = new Array(80);
    var H0 = 0x67452301;
    var H1 = 0xEFCDAB89;
    var H2 = 0x98BADCFE;
    var H3 = 0x10325476;
    var H4 = 0xC3D2E1F0;
    var A, B, C, D, E;
    var temp;

    str = utf8_encode(str);
    var str_len = str.length;

    var word_array = [];
    for (i = 0; i < str_len - 3; i += 4) {
        j = str.charCodeAt(i) << 24 | str.charCodeAt(i + 1) << 16 | str.charCodeAt(i + 2) << 8 | str.charCodeAt(i + 3);
        word_array.push(j);
    }

    switch (str_len % 4) {
        case 0:
            i = 0x080000000;
            break;
        case 1:
            i = str.charCodeAt(str_len - 1) << 24 | 0x0800000;
            break;
        case 2:
            i = str.charCodeAt(str_len - 2) << 24 | str.charCodeAt(str_len - 1) << 16 | 0x08000;
            break;
        case 3:
            i = str.charCodeAt(str_len - 3) << 24 | str.charCodeAt(str_len - 2) << 16 | str.charCodeAt(str_len - 1) <<
                8 | 0x80;
            break;
    }

    word_array.push(i);

    while ((word_array.length % 16) != 14) {
        word_array.push(0);
    }

    word_array.push(str_len >>> 29);
    word_array.push((str_len << 3) & 0x0ffffffff);

    for (blockstart = 0; blockstart < word_array.length; blockstart += 16) {
        for (i = 0; i < 16; i++) {
            W[i] = word_array[blockstart + i];
        }
        for (i = 16; i <= 79; i++) {
            W[i] = rotate_left(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);
        }

        A = H0;
        B = H1;
        C = H2;
        D = H3;
        E = H4;

        for (i = 0; i <= 19; i++) {
            temp = (rotate_left(A, 5) + ((B & C) | (~B & D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B, 30);
            B = A;
            A = temp;
        }

        for (i = 20; i <= 39; i++) {
            temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B, 30);
            B = A;
            A = temp;
        }

        for (i = 40; i <= 59; i++) {
            temp = (rotate_left(A, 5) + ((B & C) | (B & D) | (C & D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B, 30);
            B = A;
            A = temp;
        }

        for (i = 60; i <= 79; i++) {
            temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B, 30);
            B = A;
            A = temp;
        }

        H0 = (H0 + A) & 0x0ffffffff;
        H1 = (H1 + B) & 0x0ffffffff;
        H2 = (H2 + C) & 0x0ffffffff;
        H3 = (H3 + D) & 0x0ffffffff;
        H4 = (H4 + E) & 0x0ffffffff;
    }

    temp = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);
    return temp.toLowerCase();
}

function utf8_encode(argString) {
    //  discuss at: http://phpjs.org/functions/utf8_encode/
    // original by: Webtoolkit.info (http://www.webtoolkit.info/)
    // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // improved by: sowberry
    // improved by: Jack
    // improved by: Yves Sucaet
    // improved by: kirilloid
    // bugfixed by: Onno Marsman
    // bugfixed by: Onno Marsman
    // bugfixed by: Ulrich
    // bugfixed by: Rafal Kukawski
    // bugfixed by: kirilloid
    //   example 1: utf8_encode('Kevin van Zonneveld');
    //   returns 1: 'Kevin van Zonneveld'

    if (argString === null || typeof argString === 'undefined') {
        return '';
    }

    var string = (argString + ''); // .replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    var utftext = '',
        start, end, stringl = 0;

    start = end = 0;
    stringl = string.length;
    for (var n = 0; n < stringl; n++) {
        var c1 = string.charCodeAt(n);
        var enc = null;

        if (c1 < 128) {
            end++;
        } else if (c1 > 127 && c1 < 2048) {
            enc = String.fromCharCode(
                (c1 >> 6) | 192, (c1 & 63) | 128
            );
        } else if ((c1 & 0xF800) != 0xD800) {
            enc = String.fromCharCode(
                (c1 >> 12) | 224, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128
            );
        } else { // surrogate pairs
            if ((c1 & 0xFC00) != 0xD800) {
                throw new RangeError('Unmatched trail surrogate at ' + n);
            }
            var c2 = string.charCodeAt(++n);
            if ((c2 & 0xFC00) != 0xDC00) {
                throw new RangeError('Unmatched lead surrogate at ' + (n - 1));
            }
            c1 = ((c1 & 0x3FF) << 10) + (c2 & 0x3FF) + 0x10000;
            enc = String.fromCharCode(
                (c1 >> 18) | 240, ((c1 >> 12) & 63) | 128, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128
            );
        }
        if (enc !== null) {
            if (end > start) {
                utftext += string.slice(start, end);
            }
            utftext += enc;
            start = end = n + 1;
        }
    }

    if (end > start) {
        utftext += string.slice(start, stringl);
    }

    return utftext;
}

function addslashes(str) {
    //  discuss at: http://phpjs.org/functions/addslashes/
    // original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // improved by: Ates Goral (http://magnetiq.com)
    // improved by: marrtins
    // improved by: Nate
    // improved by: Onno Marsman
    // improved by: Brett Zamir (http://brett-zamir.me)
    // improved by: Oskar Larsson Högfeldt (http://oskar-lh.name/)
    //    input by: Denny Wardhana
    //   example 1: addslashes("kevin's birthday");
    //   returns 1: "kevin\\'s birthday"

    return (str + '')
        .replace(/[\\"']/g, '\\$&')
        .replace(/\u0000/g, '\\0');
}

function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
}

function str2ab(str) {
    var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}