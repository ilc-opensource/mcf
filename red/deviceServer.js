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
var events = require("events"); // This is the node.js events not the local one
var flows = require("./nodes/flows");

// Different protocol servers, move to server.js
//var wsServer = require("./protocol/ws");
//var discovery = require("./discovery");

var activeConnections = [];
var pendingMsg = [];
var nodeIdToConnection = {};
var devToConnection = []; //{}

// virtual local server
function devServer() {
}
util.inherits(devServer, events.EventEmitter);

devServer.prototype.init = function(_server,_settings) {
    // Move to server.js
    //wsServer.init(_server, _settings);
    //discovery.init(_server,_settings);
}

devServer.prototype.start = function() {
    // start real servers of different protocols, move to server.js
    //wsServer.start();
    //discovery.start();
}

function publish(topic, nodeId, data) {
    activeConnections.forEach(function(conn) {
        publishTo(conn, topic, nodeId, data);
    });
}

function publishTo(connection, topic, nodeId, data) {
    if (nodeId != null && data != null) {
        var msg = JSON.stringify({topic:topic, nodeId:nodeId, data:data});
    } else if (nodeId != null){
        var msg = JSON.stringify({topic:topic, nodeId:nodeId});
    } else if (data != null) {
        var msg = JSON.stringify({topic:topic, data:data});
    }
    util.log("Send Msg:"+topic);
    try {
        connection.send(msg);
    } catch(err) {
        util.log("send error : "+err.toString());
    }
}

// Local flow use this method to send msg to remote devices
devServer.prototype.send = function(nodeId, m) { // m is an object
    util.log("Try to send a remote msg to "+nodeId+":"+JSON.stringify(m));
    if (nodeIdToConnection[nodeId]) {
        //util.log("Node "+nodeId+" has found.");
        publishTo(nodeIdToConnection[nodeId], "oneToOne", nodeId, m);
    } else {
        //util.log("Try to find node "+nodeId);
        // TODO: add time to clean the old msg
        pendingMsg.push({nodeId:nodeId, m:m});
        //searchDev(nodeId);
        publish("broadcast", nodeId, null);
    }
}

// Local device try to deploy a flow to remote device
devServer.prototype.deploy = function(dev, flow) {
    util.log("devToConnection[dev]="+(devToConnection[dev]!=null)+"; dev="+dev);
    publishTo(devToConnection[dev], "deploy", null, flow);
}

var deviceServer = new devServer();
/**
 * Message format
 * topic:           nodeId:       data:
 *   broadcast      nodeId        null
 *   oneToOne       nodeId        msg
 *   ownNode        nodeId        null
 *   channel        remoteDevID
 **/
deviceServer.on("message", function(msg) { // msg is an object not a JSON string here
    //var msg = JSON.parse(data);
    if (msg.topic == "oneToOne") { // Has already create 1-1 channel
        var node = flows.get(msg.nodeId);
        if (node) {
            util.log("oneToOne msg="+msg.data)
            node.receive(msg.data);
        } else {
            // TODO: re redirect
        }
    } else if (msg.topic == "broadcast") { // Try to create 1-1 channel
        var node = flows.get(msg.nodeId);
        if (node) {
            publishTo(msg.connection, "ownNode", msg.nodeId, null); // Send akn msg
        }
    } else if (msg.topic == "ownNode") { // akn
        nodeIdToConnection[msg.nodeId] = msg.connection;
        for(var i=pendingMsg.length-1; i>=0; i--) {
            if (pendingMsg[i].nodeId == msg.nodeId) {
                publishTo(msg.connection, "oneToOne", pendingMsg[i].nodeId, pendingMsg[i].m);
                pendingMsg.splice(i, 1);
            }
        }
    } else if (msg.topic == "deploy") { // Deploy flow to remote device
        console.log("Receive a flow deploy request from remote device");
        var flow = msg.data;
        for(var i in flows) {util.log(i);}
        flows.setFlows(flow).then(function() {
                ;
            }).otherwise(function(err) {
                util.log("[red] Error saving flows : "+err);
                ;
            });
    } else if (msg.topic == "channel") { // Bind connection to target device
        devToConnection[msg.remoteDevID] = msg.connection;
        activeConnections.push(msg.connection);
    } else {
        console.log("other message!!!!");
    }
});

module.exports = deviceServer;
