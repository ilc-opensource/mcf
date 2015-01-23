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

var os = require("os");
var ws = require("ws");
var util = require("util");
var events = require("./events");
var discover = require('node-discover');
var localDev = require("./localDev");

var wsProtocol = require("./protocol/ws");

var localDevice = null;
var foundDev = [];

function init(_server,_settings) {
    console.log("in discovery.js init");
    server = _server;
    settings = _settings;

    var devIPv4s = [];
    var ifaces=os.networkInterfaces();
    for (var dev in ifaces) {
        ifaces[dev].forEach(function(details){
            if (details.family=='IPv4') {
                if (details.address != '127.0.0.1') {
                    devIPv4s.push(details.address);
                }
            }
        });
    }

    // Put local dev into foundDev
    localDevice = {id:localDev, name:os.hostname(), ip:devIPv4s[0]}
    console.log("localDevice="+JSON.stringify(localDevice));
    foundDev.push(localDevice);
    // Only need to update UI
    events.emit("devUpdate", JSON.stringify(foundDev));
}

function start() {
    // first discovery method
    var d = new discover();
    d.advertise(localDevice);
    d.on("added", function (obj) {
        console.log("New node added to the network.");
        if (obj.advertisement != null) {
            foundDev.push(obj.advertisement);
            // Update UI and try to build a connect to
            events.emit("devUpdate", JSON.stringify(foundDev));
            events.emit("addDev", obj.advertisement)
        }
        //devServer.connect(obj);
    });
    d.on("removed", function (obj) {
        console.log("Node removed from the network.");
        if (obj.advertisement != null) {
            foundDev.pop(obj.advertisement);
            events.emit("devUpdate", JSON.stringify(foundDev));
            events.emit("delDev", obj.advertisement);
        }
        //devServer.disconnect(obj);
    });
    // first discovery method end
}

events.on("addDev", function(dev) {
    wsProtocol.connect(dev, localDevice);
});
events.on("delDev", function(dev) {
    wsProtocol.disconnect(dev);
});

module.exports = {
    init:init,
    start:start
}
