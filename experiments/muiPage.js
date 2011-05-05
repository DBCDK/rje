muiPage = (function(exports, jsonml) {

    // Generate an uniq id - probably move this to Q
    uniqId = (function() {
        var id = 0;
        return function() {
            ++id;
            return "__mui_id_" + id;
        }
    })();

    exports.setHints = function setHints(page, hints) {
        if(Array.isArray(page)) {
            var attr = page[1];
            if(attr && attr.name) {
                if(this.formValue(attr.name) || attr.value) { 
                    attr.value = this.formValue(attr.name);
                }
                if(hints[attr.name]) {
                    attr.hint = hints[attr.name];
                } else if(attr.hint) {
                    delete attr.hint;
                }
            }

            for(var i = 1; i < page.length; ++i) {
                this.setHints(page[i], hints);
            }
        }
        return page;
    }

    exports.transformFactory = function(config) { return function pageTransform(page, mui) {
        mui.prevPage = function() { return page; };
        var handlers = {

            section: function(html, node) {
                var result = ["div", {"class": "contentbox"}];
                jsonml.childReduce(node, nodeHandler, result);
                html.push(result);
            },

            input: function(html, node) {
                var value =  jsonml.getAttr(node, "value") || "";
                var type = jsonml.getAttr(node, "type");
                var label = jsonml.getAttr(node, "label") || "";
                var hint = jsonml.getAttr(node, "hint");

                var name = jsonml.getAttr(node, "name");
                if(!name) {
                    throw "input widgets must have a name attribute";
                }

                var result = ["div", {"class": "input"}];
                if(!type) {
                    throw "input widgets must have a type attribute";
                }

                var tagAttr = {"class": type, "name": name};

                if(label) {
                    var labelid = uniqId();
                    if(config.placeholder) {
                        tagAttr.placeholder = label;
                    } else {
                        result.push(["div", {"class": "label"}, ["label", {"for": labelid}, label, ":"]]);
                    } 
                    tagAttr.id = labelid;
                }

                if(type === "textbox") {
                    result.push(["textarea", tagAttr, value]);                

                } else { // normal input
                    tagAttr.value = value;
                        tagAttr.type = type;
                        if(type === "tel" && !config.telInput) {
                            tagAttr.type = "number";
                            
                        }
                    result.push(["input", tagAttr]);
                }
                if(hint) {
                    result.push(["div", {"class": "hint"}, "*", hint]);
                }
                html.push(result);
            },

            choice: function(html, node) {
                var defaultValue = jsonml.getAttr(node, "value") || "";
                var label = jsonml.getAttr(node, "label") || "";
                var hint = jsonml.getAttr(node, "hint");

                var result = ["div", {"class": "input"}];

                var tagAttr = {"name": jsonml.getAttr(node, "name")};
                var select = ["select", tagAttr];

                var label = jsonml.getAttr(node, "label");
                if(label) {
                    if(defaultValue) {
                        select.push(["option", {value: ""}, label]);
                    } else {
                        select.push(["option", {value: "", selected: "selected"}, label]);
                    }
                }

    
                jsonml.childReduce(node, function(result, node) {
                    if(node[0] !== "option") {
                        throw "only option nodes are allows as children to choices";
                    }
                    var value =  jsonml.getAttr(node, "value");
                    if(!value) {
                        throw "option widgets must have a value attribute";
                    }
                    var attrs = { value : value };
                    if(value === defaultValue) {
                        attrs.selected = "selected";
                    }
                    select.push(["option", attrs, node[2]]);
                    return result;
                }, result);
                result.push(select);
                if(hint) {
                    result.push(["div", {"class": "hint"}, "*", hint]);
                }
                html.push(result);
            },

            text: function(html, node) {
                var result = ["div", {"class": "text"}];
                jsonml.childReduce(node, nodeHandler, result);
                html.push(result);
            },

            button: function(html, node) {
                if(!jsonml.getAttr(node, "fn")) {
                    throw "buttons must have an fn attribute, containing a function to call";
                }

                    var fnid = uniqId();
                    __mui__.__callbacks[fnid] = jsonml.getAttr(node, "fn");
                    var attr = {"class": "button", onclick: "__mui__.__call_fn('"+fnid+"');"};
                    var result = ["div", attr];
                    jsonml.childReduce(node, nodeHandler, result);
                    html.push(result);
            }
        };
    
        function nodeHandler(html, node) {
            if(typeof(node) === "string") {
                html.push(node);
            } else {
                var handle = handlers[node[0]]; 
                if(!handle) {
                    throw "mui received a page containing an unknown tagtype: " + node[0];
                }
                handle(html, node);
            }
            return html;
        }
    
            var html = ["form"];
            var title = jsonml.getAttr(page, "title") || "untitled";
            jsonml.childReduce(page, nodeHandler, html);
            return [["div", {"class":"header"}, title], html, ["div", {"class":"contentend"}, " "]];

    }; };

return exports; })({}, jsonml);
