/**
 * Copyright 2014 IBM Corp.
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

var util = require("util");
var events = require("../events");
var WebSocket = require("ws");
var WebSocketServer = WebSocket.Server;
var deviceServer = require("../deviceServer");
var localDeviceID = require("../localDev");

var server;
var settings;

var wsUI = null;

function onConnect(ws) {
        ws.on("message", function(data, flags) {
            console.log("receive a remote msg");
            if (JSON.parse(data).topic == "devUpdate") { // This is the connection from UI
                wsUI = ws;
                if (deviceList != null) {
                    console.log("send devList update to UI");
                    wsUI.send(JSON.stringify({topic:"devUpdate", data:JSON.parse(deviceList)}));
                }
                return;
            } else {
                var msg = JSON.parse(data);
                msg.connection = ws;
                deviceServer.emit("message", msg);
                return;
            }
            //deviceServer.emit("message", JSON.parse(data));
        });
        ws.on('close',function() {
            console.log("ws connection closed");
        });
        ws.on('error', function(err) {
            util.log("error : "+err.toString());
        });

}

function init(_server,_settings) {
    server = _server;
    settings = _settings;
}

function start() {
    util.log("Create WebSocket server");
    var wsServer = new WebSocketServer({server:server, path:"/devWSSever"});

    wsServer.on("connection", function(ws) {
        onConnect(ws);
        /*ws.on("message", function(data, flags) {
            console.log("receive a remote msg");
            if (JSON.parse(data).topic == "devUpdate") { // This is the connection from UI
                wsUI = ws;
                if (deviceList != null) {
                    console.log("send devList update to UI");
                    wsUI.send(JSON.stringify({topic:"devUpdate", data:JSON.parse(deviceList)}));
                }
                return;
            } else {
                var msg = JSON.parse(data);
                msg.connection = ws;
                deviceServer.emit("message", msg);
                return;
            }
            //deviceServer.emit("message", JSON.parse(data));
        });
        ws.on('close',function() {
            console.log("ws connection closed");
        });
        ws.on('error', function(err) {
            util.log("error : "+err.toString());
        });*/
    });

    wsServer.on('error', function(err) {
        util.log("server error : "+err.toString());
    });
}

function connect(remoteDev, localDevice, timeInterval) {
    var path = "ws://"+remoteDev.ip+":1880/devWSSever";
    console.log("remote ws connection="+path)
    var ws = new WebSocket(path);
    if (typeof timeInterval == 'undefined') {
        setTimeout(function(){checkConnection(ws, remoteDev, localDevice, 500);}, 500);
    } else {
        setTimeout(function(){checkConnection(ws, remoteDev, localDevice, timeInterval);}, timeInterval);
    }
}
function checkConnection(ws, remoteDev, localDevice, timeInterval) {
    try {
        ws.send(JSON.stringify({topic:"channel", remoteDevID:localDevice.id}));
    } catch(e) {
        console.log("try to rebuild ws connection");
        connect(remoteDev, localDevice, timeInterval+200);
        return;
    }
    ws.on("open", function() {
        //ws.send(JSON.stringify({topic:"channel", remoteDevID:localDevice.id}));
    });
    onConnect(ws);
}

function disconnect(remoteDev) {
}

// Send device list update to UI
// Cache deviceList for UI first connection to get device list, as the server may finish dev discovery before UI connection
var deviceList = null;
events.on("devUpdate", function(devs) {
    deviceList = devs;
    if (wsUI != null) {
        console.log("send devList update to UI");
        wsUI.send(JSON.stringify({topic:"devUpdate", data:JSON.parse(devs)}));
    } else {
        console.log("No ws connection from UI to wsServer");
    }
});

module.exports = {
    init:       init,
    start:      start,
    connect:    connect,
    disconnect: disconnect
}

