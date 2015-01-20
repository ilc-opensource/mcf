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

RED.palette = (function() {

    // Add by MCF. Add device and flow tag to palette
    var mcf = ['device', 'flow'];
    function createMcfContainer(category){
        var escapedCategory = category.replace(" ","_");
        $("#palette-container").append('<div class="palette-category">'+
            '<div id="header-'+category+'" class="palette-header"><i class="expanded fa fa-caret-down"></i><span>'+category.replace("_"," ")+'</span></div>'+
            '<div class="palette-content" id="palette-base-category-'+category+'">'+
            '</div>'+
            '</div>');

        $("#header-"+category).on('click', function(e) {
            $(this).next().slideToggle();
            $(this).children("i").toggleClass("expanded");
        });
    }
    mcf.forEach(createMcfContainer);
    // Add by MCF, end

    var exclusion = ['config','unknown','deprecated'];
    var core = ['input', 'output', 'function', 'subflows', 'social', 'storage', 'analysis', 'advanced'];

    function createCategoryContainer(category){
        var escapedCategory = category.replace(" ","_");
        $("#palette-container").append('<div class="palette-category">'+
            '<div id="header-'+category+'" class="palette-header"><i class="expanded fa fa-caret-down"></i><span>'+category.replace("_"," ")+'</span></div>'+
            '<div class="palette-content" id="palette-base-category-'+category+'">'+
            '<div id="palette-'+category+'-input"></div>'+
            '<div id="palette-'+category+'-output"></div>'+
            '<div id="palette-'+category+'-function"></div>'+
            '</div>'+
            '</div>');

        $("#header-"+category).on('click', function(e) {
            $(this).next().slideToggle();
            $(this).children("i").toggleClass("expanded");
        });
    }

    core.forEach(createCategoryContainer);

    function setLabel(type, el,label) {
        var nodeWidth = 80;
        var nodeHeight = 25;
        var lineHeight = 20;
        var portHeight = 10;

        var words = label.split(" ");

        var displayLines = [];

        var currentLine = words[0];
        var currentLineWidth = RED.view.calculateTextWidth(currentLine, "palette_label", 0);

        for (var i=1;i<words.length;i++) {
            var newWidth = RED.view.calculateTextWidth(currentLine+" "+words[i], "palette_label", 0);
            if (newWidth < nodeWidth) {
                currentLine += " "+words[i];
                currentLineWidth = newWidth;
            } else {
                displayLines.push(currentLine);
                currentLine = words[i];
                currentLineWidth = RED.view.calculateTextWidth(currentLine, "palette_label", 0);
            }
        }
        displayLines.push(currentLine);

        var lines = displayLines.join("<br/>");
        var multiLineNodeHeight = 8+(lineHeight*displayLines.length);
        el.css({height:multiLineNodeHeight+"px"});

        var labelElement = el.find(".palette_label");
        labelElement.html(lines);

        el.find(".palette_port").css({top:(multiLineNodeHeight/2-5)+"px"});

        var popOverContent;
        try {
            var l = "<p><b>"+label+"</b></p>";
            if (label != type) {
                l = "<p><b>"+label+"</b><br/><i>"+type+"</i></p>";
            }
            popOverContent = $(l+($("script[data-help-name|='"+type+"']").html()||"<p>no information available</p>").trim()).slice(0,2);
        } catch(err) {
            // Malformed HTML may cause errors. TODO: need to understand what can break
            console.log("Error generating pop-over label for '"+type+"'.");
            console.log(err.toString());
            popOverContent = "<p><b>"+label+"</b></p><p>no information available</p>";
        }


        el.data('popover').options.content = popOverContent;
    }

    function escapeNodeType(nt) {
        return nt.replace(" ","_").replace(".","_").replace(":","_");
    }

    function addNodeType(nt,def) {

        var nodeTypeId = escapeNodeType(nt);
        if ($("#palette_node_"+nodeTypeId).length) {
            return;
        }

        if (exclusion.indexOf(def.category)===-1) {

            var category = def.category.replace(" ","_");
            var rootCategory = category.split("-")[0];

            var d = document.createElement("div");
            d.id = "palette_node_"+nodeTypeId;
            d.type = nt;

            var label;

            if (typeof def.paletteLabel === "undefined") {
                label = /^(.*?)([ -]in|[ -]out)?$/.exec(nt)[1];
            } else {
                label = (typeof def.paletteLabel === "function" ? def.paletteLabel.call(def) : def.paletteLabel)||"";
            }

            d.innerHTML = '<div class="palette_label"></div>';

            d.className="palette_node";
            if (def.icon) {
                d.style.backgroundImage = "url(icons/"+def.icon+")";
                d.style.backgroundSize = "18px 27px";
                if (def.align == "right") {
                    d.style.backgroundPosition = "95% 50%";
                } else if (def.inputs > 0) {
                    d.style.backgroundPosition = "10% 50%";
                }
            }

            d.style.backgroundColor = def.color;

            if (def.outputs > 0) {
                var portOut = document.createElement("div");
                portOut.className = "palette_port palette_port_output";
                d.appendChild(portOut);
            }

            if (def.inputs > 0) {
                var portIn = document.createElement("div");
                portIn.className = "palette_port palette_port_input";
                d.appendChild(portIn);
            }

            if ($("#palette-base-category-"+rootCategory).length === 0) {
                createCategoryContainer(rootCategory);
            }

            if ($("#palette-"+category).length === 0) {
                $("#palette-base-category-"+rootCategory).append('<div id="palette-'+category+'"></div>');
            }

            $("#palette-"+category).append(d);
            d.onmousedown = function(e) { e.preventDefault(); };

            $(d).popover({
                title:d.type,
                placement:"right",
                trigger: "hover",
                delay: { show: 750, hide: 50 },
                html: true,
                container:'body'
            });
            $(d).click(function() {
                var help = '<div class="node-help">'+($("script[data-help-name|='"+d.type+"']").html()||"")+"</div>";
                $("#tab-info").html(help);
            });
            $(d).draggable({
                helper: 'clone',
                appendTo: 'body',
                revert: true,
                revertDuration: 50
            });

            setLabel(nt,$(d),label);
        }
    }

    function removeNodeType(nt) {
        var nodeTypeId = escapeNodeType(nt);
        $("#palette_node_"+nodeTypeId).remove();
    }
    function hideNodeType(nt) {
        var nodeTypeId = escapeNodeType(nt);
        $("#palette_node_"+nodeTypeId).hide();
    }

    function showNodeType(nt) {
        var nodeTypeId = escapeNodeType(nt);
        $("#palette_node_"+nodeTypeId).show();
    }

    function refreshNodeTypes() {
        RED.nodes.eachSubflow(function(sf) {
            var paletteNode = $("#palette_node_subflow_"+sf.id.replace(".","_"));
            var portInput = paletteNode.find(".palette_port_input");
            var portOutput = paletteNode.find(".palette_port_output");

            if (portInput.length === 0 && sf.in.length > 0) {
                var portIn = document.createElement("div");
                portIn.className = "palette_port palette_port_input";
                paletteNode.append(portIn);
            } else if (portInput.length !== 0 && sf.in.length === 0) {
                portInput.remove();
            }

            if (portOutput.length === 0 && sf.out.length > 0) {
                var portOut = document.createElement("div");
                portOut.className = "palette_port palette_port_output";
                paletteNode.append(portOut);
            } else if (portOutput.length !== 0 && sf.out.length === 0) {
                portOutput.remove();
            }
            setLabel(sf.type+":"+sf.id,paletteNode,sf.name);
        });
    }

    function filterChange() {
        var val = $("#palette-search-input").val();
        if (val === "") {
            $("#palette-search-clear").hide();
        } else {
            $("#palette-search-clear").show();
        }

        var re = new RegExp(val,'i');
        $(".palette_node").each(function(i,el) {
            if (val === "" || re.test(el.id)) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    }

    $("#palette-search-input").focus(function(e) {
        RED.keyboard.disable();
    });
    $("#palette-search-input").blur(function(e) {
        RED.keyboard.enable();
    });

    $("#palette-search-clear").on("click",function(e) {
        e.preventDefault();
        $("#palette-search-input").val("");
        filterChange();
        $("#palette-search-input").focus();
    });

    $("#palette-search-input").val("");
    $("#palette-search-input").on("keyup",function() {
        filterChange();
    });

    $("#palette-search-input").on("focus",function() {
        $("body").one("mousedown",function() {
            $("#palette-search-input").blur();
        });
    });

    return {
        add:addNodeType,
        remove:removeNodeType,
        hide:hideNodeType,
        show:showNodeType,
        refresh:refreshNodeTypes
    };
})();
