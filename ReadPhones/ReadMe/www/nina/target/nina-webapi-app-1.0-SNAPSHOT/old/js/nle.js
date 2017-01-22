Q.longStackSupport = true;

var nleExpertModeEnabled = false;
var defaultMdoel = {
    name: "flights",
    version: "1.0.0",
    url: "http://10.167.20.42:8277/VARS/Flights_classic_new.zip"
};

function nleExpertMode()
{
    if (nleExpertModeEnabled)
    {
        $("#nle_expert_mode_button").html("Expert Mode");
        $("#nle_text_to_send").val("");
    }
    else
    {

        var text_to_send = $("#nle_text_to_send");

        $("#nle_expert_mode_button").html("Normal Mode");
        var newContent = {
            text: text_to_send.val().trim(),
            model: defaultMdoel
        };
        text_to_send.val(JSON.stringify(newContent, null, 3));
    }

    nleExpertModeEnabled = !nleExpertModeEnabled;

    textChanged("nle_text_to_send", "request_nle_button");
}

function requestNLE()
{
    var text_to_interpret = fixLineBreaks($("#nle_text_to_send").val());
    var nleInput;

    if (!$("#request_nle_button").hasClass("disabled"))
    {
        if (nleExpertModeEnabled)
        {
            nleInput = JSON.parse(text_to_interpret);
        }
        else
        {
            nleInput = {
                text: text_to_interpret,
                model: defaultMdoel
            };
        }
        ninaSession.nle(nleInput).then(logResponse, logError);
    }
}