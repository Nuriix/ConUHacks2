//Websocket method for Varolii
function requestVarolii() {
    var selectedClient = $("#clientId option:selected").val();
    if($( "#getTab" ).hasClass("active")){
        $("#get").text("");
        ninaSession.varolii($("#personId_input").val().trim(), selectedClient, "GETPERSON").then(resultsVarolii);
    }
    else if($( "#putTab" ).hasClass("active")){
        $("#put").text("");
        var varoliiJson = {
            "clientId": selectedClient,
            "firstName": $("#firstName_input").val().trim(),
            "lastName": $("#lastName_input").val().trim(),
            "title": null,
            "gender": "M",
            "dateOfBirth": null,
            "ssn9": null,
            "ssn4": null,
            "addresses": [
                {
                    "street":  $("#street_input").val().trim(),
                    "city": $("#city_input").val().trim(),
                    "state": $("#state_input").val().trim(),
                    "zip5": $("#zip_input").val().trim(),
                    "zip9": null,
                    "county": "King",
                    "country": "US"
                }
            ],
            "contacts": [
                {
                    "type": "PHONE",
                    "address": $("#phone_input").val().trim(),
                    "appToken": null,
                    "instanceId": null,
                    "source": "CLIENT_INPUT"
                }
            ],
            "accounts": [
                {
                    "accountId": $("#account_input").val().trim()
                }
            ]
        };
        ninaSession.varolii(JSON.stringify(varoliiJson, null, 3), selectedClient, "PUTPERSON").then(resultsVarolii);
    }
    else if($("#removeTab").hasClass("active")){
        $("#remove").text("");
        ninaSession.varolii($("#personIdRemove_input").val().trim(), selectedClient, "REMOVEPERSON").then(resultsVarolii);
    }
    else if ($("#putInfoTab").hasClass("active")){
        $("#putInfo").text("");
        var varoliiDataJson = {
            "nmaid_id": $("#nmaid_id_input").val().trim(),
            "nmaid_key": $("#nmaid_key_input").val().trim(),
            "companyName": $("#companyName_input").val().trim(),
            "appName": $("#appName_input").val().trim()
        };
        var varoliiInfoJson= {
            "id": $("#dataId_input").val().trim(),
            "eventDate": 1390852794000,
            "category" : "outcome",
            "clientId" : selectedClient,
            "personId" : $("#personIdInfo_input").val().trim(),
            "data" : varoliiDataJson
        };
        ninaSession.varolii(JSON.stringify(varoliiInfoJson, null, 3), selectedClient, "PUTINFO", $("#personIdInfo_input").val().trim()).then(resultsVarolii);
    }
    else if ($("#getInfoTab").hasClass("active")){
        $("#getInfo").text("");
        ninaSession.varolii($("#infoId_input").val().trim(), selectedClient, "GETINFO").then(resultsVarolii);
    }
}

function resultsVarolii(varolii) {

    if($( "#getTab" ).hasClass("active")){
        if(varolii.message){
            $("#get").text(varolii.message);
        }else{
            $("#get").append("ID: " + varolii.id + "<br/>");
            $("#get").append("First Name: " + varolii.firstName + "<br/>");
            $("#get").append("Last Name: " + varolii.lastName + "<br/>");
            $("#get").append("Phone: " + varolii.contacts[0].address + "<br/>");
        }
    }
    else if($("#putTab").hasClass("active")){
        $("#put").text("id : " + varolii.clientId);
    }
    else if($("#removeTab").hasClass("active")){
        $("#remove").text(varolii.message);
    }
    else if($("#putInfoTab").hasClass("active")){
        $("#putInfo").text(varolii.message);
    }
    else if($("#getInfoTab").hasClass("active")){
        if(varolii.message){
            $("#getInfo").text(varolii.message);
        }else{
            var arr = varolii;
            arr.forEach(function(s){
                $("#getInfo").append("Data Id: " + s.id + "<br/>");
                $("#getInfo").append("NMAID_ID: " + s.data.nmaid_id + "<br/>");
                $("#getInfo").append("NMAID_KEY: " + s.data.nmaid_key + "<br/>");
                $("#getInfo").append("Company Name: " + s.data.companyName + "<br/>");
                $("#getInfo").append("App Name: " + s.data.appName + "<br/>");
                $("#getInfo").append("<br/>");
            });
        }
    }
}