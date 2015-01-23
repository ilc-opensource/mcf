/**
 * Copyright 2013 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

RED.devList = function() {

    var prefix = "DEV_";

    var tmpDev = null;
    var selectedDev = null;

    function createDev(obj) {
        var d = document.createElement("input");
        d.id = prefix+obj.id;
        d.className="palette_node";
        d.value = obj.name;
        d.style.backgroundColor = "white";
        d.onclick = function() {
            if (selectedDev != this.id) {
                if (selectedDev != null) {
                    document.getElementById(selectedDev).style.backgroundColor = "white";
                    document.getElementById(selectedDev).style.color = "#000000";
                }
                selectedDev = this.id;
                this.style.backgroundColor = "#0033FF";
                this.style.color = "#FFFFFF";
            } else {
                selectedDev = null;
                this.style.backgroundColor = "white";
                this.style.color = "#000000";
            }
        };
        if (tmpDev == d.id) {
            selectedDev = d.id;
            d.style.backgroundColor = "#0033FF";
            d.style.color = "#FFFFFF";
        }
        $("#palette-base-category-device").append(d);
    }

    // This websocket client is used to connect to local ws server, to get devList only
    // WS server send {id:, name:} to this client
    var ws;
    function connectWS() {
        var path = document.location.hostname+":"+document.location.port+document.location.pathname;
        path = path+(path.slice(-1) == "/"?"":"/")+"devWSSever";
        path = "ws"+(document.location.protocol=="https:"?"s":"")+"://"+path;
        ws = new WebSocket(path);
        ws.onopen = function() {
            console.log("Connected to ws server");
            // Send msg to notify local ws server, which is the ws connection to UI
            ws.send(JSON.stringify({topic:"devUpdate"}));
        }
        ws.onmessage = function(message) {
            var msg = JSON.parse(message.data);
            console.log("Device list="+message.data);
            if (msg.topic == "devUpdate") {
                // Delete all elements in dev
                tmpDev = selectedDev;
                selectedDev = null;
                $("#palette-base-category-device").empty();

                // Create dev elements
                var deviceList = msg.data;
                console.log("deviceList.length="+deviceList.length);
                for (var i=0; i<deviceList.length; i++) {
                    createDev(deviceList[i]);
                }
            }
        };
        ws.onclose = function() {
            if (errornotification == null) {
                errornotification = RED.notify("<b>Error</b>: Lost connection to server","error",true);
            }
            //setTimeout(connectWS,1000);
        }
    }

    // Return device id
    function getSelectedDev() {
        return selectedDev.slice(prefix.length);
    }

    return {
        start: connectWS,
        get:   getSelectedDev
    };
}();
