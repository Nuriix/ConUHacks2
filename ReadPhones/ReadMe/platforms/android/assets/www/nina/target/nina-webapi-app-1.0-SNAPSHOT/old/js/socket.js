

function Socket(uri, msgHandler)
{
    if (!uri)
    {
        throw "Connection cannot be made without URI";
    }

    var ws = undefined;
    var serviceURI = uri;
    var def = undefined;

    var messageHandler = msgHandler || function(msg) { console.log("received message: '" + msg + "'."); };

    this.connect = function()
    {
        if (!def)
        {
            def = Q.defer();

            ws = new WebSocket(serviceURI);

            ws.binaryType = "arraybuffer";

            ws.onopen = function(evt) {
                def.notify(evt);
            };

            ws.onclose = function(evt)
            {
                def.resolve(evt);
            };

            ws.onmessage = function(evt){
                messageHandler(evt.data);
            };

            ws.onerror = function(evt) {
                def.reject(evt);
            }
        }
        else if (console)
        {
            console.log("Already connected.");
        }

        return def.promise;
    };


    this.sendJSON = function(message) {
        if (message) ws.send(JSON.stringify(message));
    };

    this.send = function(data)
    {
        if (data) { ws.send(data); return data.byteLength; }
        return 0;
    };

    this.disconnect = function() {
        if (ws) ws.close();
    };

}