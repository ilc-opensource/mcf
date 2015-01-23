var util = require('util');
var randomstring = require("randomstring");

var localDeviceID = randomstring.generate();
util.log("localDeviceID="+localDeviceID);

module.exports = localDeviceID;
