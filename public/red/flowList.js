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
RED.flowList = function() {

    var flows = [];
    var selectedFlow = null;

    function updateFlow(newValue, oldValue) {
        if (oldValue != '') {
            if(!(typeof(flows[oldValue]) === "undefined")) {
                if(flows[oldValue] == 1) {
                    console.log("Delete a flow");
                    delete flows[oldValue];
                    // Delete flow
                    $("#FLOW_"+oldValue).remove();
                    if (oldValue == selectedFlow) {
                        selectedFlow = null;
                    }
                } else {
                    //
                    console.log("reference count -1");
                    flows[oldValue] -= 1;
                }
            } else {
                console.log("Error, invalid oldValue");
            }
        }

        if (newValue != "") {
            if (typeof(flows[newValue]) === "undefined") {
                console.log("Create a flow");
                flows[newValue] = 1;
                // Create a new flow in ui
                var d = document.createElement("input");
                d.id = "FLOW_"+newValue;
                d.className="palette_node";
                d.value = newValue;
                d.style.backgroundColor = "white";
                d.onclick = function() {
                    if (selectedFlow != this.value) {
                        if (selectedFlow != null) {
                            document.getElementById("FLOW_"+selectedFlow).style.backgroundColor = "white";
                            document.getElementById("FLOW_"+selectedFlow).style.color = "#000000";
                        }
                        selectedFlow = this.value;
                        //this.style.backgroundColor = "blue";
                        this.style.backgroundColor = "#0033FF";
                        this.style.color = "#FFFFFF";
                    } else {
                        selectedFlow = null;
                        this.style.backgroundColor = "white";
                        this.style.color = "#000000";
                    }
                };
                $("#palette-base-category-flow").append(d);
            } else {
                console.log("reference count +1");
                flows[newValue] += 1;
            }
        }
    }

    // Return name of flow
    function getFlow() {
        return selectedFlow;
    }
    return {
        update: updateFlow,
        get:    getFlow
    };
}();
