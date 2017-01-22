var connectionData = {
    nmsp: nmsp,
    nmaidKey: nmaidKey,
    nmaid: nmaidId,
    uid: "447F329B3AE44DC3840AE60E70A07BB0-0",
    scriptVersion: "1.0",
    dictationLanguage: "en_US",
    carrier: "Unknown",
    phoneModel: "Unknown"
};

var defaultVoice = "Carol";
var defaultLanguage = "en-us";

function createGrammarUriList() {

    var grammar_list = [];
    for (var i = 0; i < arguments.length; ++i) {
        grammar_list.push({grammar_desc: arguments[i], grammar_type: "uri"});
    }
    return {grammar_list: grammar_list}
}

function extraGrammar(response) {
    if (response.QueryResult.adk_result.Response.adk.selfServeGrammarPath) {
        ninaSession.selfServeGrammarPath = response.QueryResult.adk_result.Response.adk.selfServeGrammarPath;
        ninaSession.default_grammar_list = createGrammarUriList(ninaSession.selfServeGrammarPath);
        log("Found self serve grammar: " + ninaSession.selfServeGrammarPath);
    }
    else {
        delete ninaSession.selfServeGrammarPath;
        delete ninaSession.default_grammar_list;
        log("Didn't find self serve grammar");
    }
}




function logError(evt)
{
    log("An error occured:" + JSON.stringify(evt, null, 2));
}

function logResponse(response)
{
    log("Received response:" + JSON.stringify(response, null, 2));
}

function startSession(evt)
{
    log("Starting Session");
    return ninaSession.startSession(
        dialogModel(),
        cloudConfig()
    ).
        tap(logResponse).
        then(undefined, logError);
}

function chain(functions)
{
    return function(arg) {
        var result = Q.fcall(functions[0], arg);
        for (var i = 1; i < functions.length; ++i)
        {
            result = result.then(functions[i]);
        }
        return result;
    }
}

function isOfType(type, obj) {
    if (obj === undefined || obj === null)
        return false;

    return type === Object.prototype.toString.call(obj).slice(8, -1);
}
