
var defaults = {
    appName: "NinaOnBoardingTemplate",
    companyName: "NUANCE",
    appVersion: "0.0",
    endPointerConfig: {
        nb_frames_background_noise: 15,
        nb_frames_start_of_speech: 10,
        nb_frames_end_of_speech: 50,
        threshold_ratio: 2.0
    },
    nmaidId: "NinaCloud",
    nmaidKey: "b7635accb9e5f37de5c9d9cd7578b6a05015720c981c6e0104f720d400bde56cfd116e4aabeee418e5ab53116ac034c97b409c0579fea300a2ec5264e7796b0b",
    // urlDialog: "https://eu.agent.virtuoz.com/nuance-universal_demos-englishus-WebBotRouter/jbotservice.asmx/TalkAgent",
    urlDialog: "http://ac-srvozrtr01.dev.ninaweb.nuance.com/nuance-nim_team-englishus-WebBotRouter/jbotservice.asmx/TalkAgent",
    nmsp: "mtl-blade20-vm142:8911",
    cloudName: "NinaCloud",
    speakerID: "12345"
};

var appName;
var companyName;
var appVersion;
var endPointerConfig;
var nmaidId;
var nmaidKey;
var urlDialog;
var nmsp;
var cloudName;
var personID;
var speakerID;

loadCredentials();

function cloudConfig() {
    var cloudConfig = JSON.parse(stringFromFile("cloudConfig"));
    cloudConfig.cloudName = cloudName;
    return JSON.stringify(cloudConfig);
}

function dialogModel() {
    var dialogModel = JSON.parse(stringFromFile("dialogModel"));
    dialogModel.application.applicationName = appName;
    dialogModel.application.applicationVersion = appVersion;
    dialogModel.application.companyName = companyName;
    return JSON.stringify(dialogModel);
}

// Load the credentials from local storage. If they don't exist, set them to their default value.
function loadCredentials() {
    console.log("loading credentials...");

    appName = localStorage.appName || defaults.appName;
    companyName = localStorage.companyName || defaults.companyName;
    appVersion = localStorage.appVersion || defaults.appVersion;
    endPointerConfig = localStorage.endPointerConfig ? JSON.parse(localStorage.endPointerConfig) : defaults.endPointerConfig;
    nmaidId = localStorage.nmaidId || defaults.nmaidId;
    nmaidKey = localStorage.nmaidKey || defaults.nmaidKey;
    urlDialog = localStorage.urlDialog || defaults.urlDialog;
    nmsp = localStorage.nmsp || defaults.nmsp;
    cloudName = localStorage.cloudName || defaults.cloudName;
    personID = localStorage.personID;
    speakerID = localStorage.speakerID || defaults.speakerID;
}

// Enter the credentials into their corresponding text fields.
function enterCredentials() {
    console.log("entering credentials...");

    $("#app-name").val(appName);
    $("#company-name").val(companyName);
    $("#app-version").val(appVersion);
    $("#background-noise-frames").val(endPointerConfig.nb_frames_background_noise);
    $("#start-of-speech-frames").val(endPointerConfig.nb_frames_start_of_speech);
    $("#end-of-speech-frames").val(endPointerConfig.nb_frames_end_of_speech);
    $("#energy-delta-ratio-threshold").val(endPointerConfig.threshold_ratio);
    $("#nmaid-id").val(nmaidId);
    $("#nmaid-key").val(nmaidKey);
    $("#ninaweb-url").val(urlDialog);
    $("#nmspGateway").val(nmsp);
    $("#cloudName").val(cloudName);
    $("#personID").val(personID);
    $("#speakerID").val(speakerID);
}

// Save the credentials from their corresponding text fields.
function saveCredentials() {
    console.log("saving credentials...");

    appName = $("#app-name").val();
    companyName = $("#company-name").val();
    appVersion = $("#app-version").val();
    endPointerConfig = {
        nb_frames_background_noise: $("#background-noise-frames").val(),
        nb_frames_start_of_speech: $("#start-of-speech-frames").val(),
        nb_frames_end_of_speech: $("#end-of-speech-frames").val(),
        threshold_ratio: $("#energy-delta-ratio-threshold").val()
    };
    nmaidId = $("#nmaid-id").val();
    nmaidKey = $("#nmaid-key").val();
    urlDialog = $("#ninaweb-url").val();
    nmsp = $("#nmspGateway").val();
    cloudName = $("#cloudName").val();
    personID = $("#personID").val();
    speakerID = $("#speakerID").val();

    saveLocalStorage();
}

// Reset all credentials to their default values.
function resetCredentials() {
    console.log("resetting credentials...");

    localStorage.clear();

    loadCredentials();
    saveLocalStorage();
}

// Save all credentials to local storage.
function saveLocalStorage() {
    console.log("saving to local storage...");

    localStorage.appName = appName;
    localStorage.companyName = companyName;
    localStorage.appVersion = appVersion;
    localStorage.endPointerConfig = JSON.stringify(endPointerConfig);
    localStorage.nmaidId = nmaidId;
    localStorage.nmaidKey = nmaidKey;
    localStorage.urlDialog = urlDialog;
    localStorage.nmsp = nmsp;
    localStorage.cloudName = cloudName;
    localStorage.personID = personID;
    localStorage.speakerID = speakerID;

    location.reload();
}

function saveVarolli() {
    console.log("saving to varolii...");

    personID = $("#personID").val().trim();

    if (!personID || personID == "") {
        alert("Invalid Person ID!");
        return;
    }

    var varoliiInfoJson = {
        "id": "credentials",
        "eventDate": 1390852794000,
        "category": "outcome",
        "clientId": 1,
        "personId": personID,
        "data": {
            "appName": nmaidId,
            "companyName": companyName,
            "appVersion": appVersion,
            "endPointerConfig": JSON.stringify(endPointerConfig),
            "nmaidId": nmaidId,
            "nmaidKey": nmaidKey,
            "urlDialog": urlDialog,
            "nmsp": nmsp,
            "lastResponse": localStorage.lastResponse,
            "savedResponse": localStorage.savedResponse
        }
    };

    ninaSession.varolii(JSON.stringify(varoliiInfoJson, null, 3), "1", "PUTINFO", personID).then(function(varolii) {
        alert("Successfully saved to Verolii!");
    });
}

function loadVarolli() {
    console.log("loading from varolii...");

    personID = $("#personID").val().trim();

    if (!personID || personID == "") {
        alert("Invalid Person ID!");
        return;
    }

    ninaSession.varolii(personID, "1", "GETINFO").then(function(varolii) {
        var found = false;

        varolii.forEach(function(object) {
            if (object.id == "credentials") {
                var data = object.data;

                appName = data.appName;
                companyName = data.companyName;
                appVersion = data.appVersion;
                endPointerConfig = JSON.parse(data.endPointerConfig);
                nmaidId = data.nmaidId;
                nmaidKey = data.nmaidKey;
                urlDialog = data.urlDialog;
                nmsp = data.nmsp;
                localStorage.lastResponse = data.lastResponse;
                localStorage.savedResponse = data.savedResponse;

                alert("Successfully loaded from Verolii!");
                found = true;

                saveLocalStorage();
            }
        });

        if (!found) {
            alert("User has no saved data!");
        }
    });
}



