var mui = (function(exports, $) {
    
    var mui = exports;
    
    // OLD STUFF TO BE REFACTORED ////////////////////////////////
    
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
    
    function transformFactory(config) { 
        return function pageTransform(page, mui) {
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
    
                    var tagAttr = {"class": type, "name": name, "id": "MUI_FORM_" + name};
    
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
    
        }; 
    };
    
    __mui__ = mui;
    
    // In a web environment, the session object is just a simple object.
    mui.session = {};
                
    
    // shorthand
    function gId(name) {
        return document.getElementById(name);
    }
    
    // Error to show, when something goes wrong
    function callbackError(e) {
        mui.showPage(["page", {title: "Error"}, 
                      ["text", e.toString()],
                      ["button", {fn: main}, "Back to start"]
                      ]);
        throw e;
    }
    
    
    // run through the dom and extract filled out
    // input values.
    function formExtract(node, acc) {
        var name = node.getAttribute && node.getAttribute("name");
        var type = node.getAttribute && node.getAttribute("type");
        if(name) {
            var tag = node.tagName;
            if(tag === "TEXTAREA"
               || tag === "SELECT"
               || (tag === "INPUT" &&
                   (type === "text" || type === "email" || type === "number" || type === "tel"))) {
                acc[name] = node.value;
            } else {
                throw "unexpected form-like element: " + tag;
            }
        }
        for(var i=0;i<node.childNodes.length;++i) {
            formExtract(node.childNodes[i], acc);
        }
        return acc;
    }
    
    var callbacks = {};
    __mui__.__callbacks = callbacks;
    __mui__.__call_fn = function(fnid) {
        var callback = callbacks[fnid];
        __mui__.__callbacks = callbacks = {};
    
        mui.formValue = (function () {
                var form = formExtract(gId("current"), {});
                return function(name) { return form[name]; }
            })();
        try {
            console.log("callback", callback, mui);
            callback(mui);
        } catch(e) {
            console.log("callback error", e);
            callbackError(e);
        }
    }
    
    
    
    // Valid characters in URIs
    var urichars = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_~.";
    
    // An uri.
    var escapeUri = exports.escapeUri = function (uri) {
        var result = [];
        for(var i=0;i<uri.length;++i) {
            var c = uri[i];
            if(urichars.indexOf(c) >= 0) {
                result.push(c);
            } else {
                c = c.charCodeAt(0);
                if(c > 127) {
                    result.push(escapeUri("&#" + c + ";"));
                } else {
                    result.push( "%" + (c<16?"0":"") + c.toString(16));
                }
            }
        }
        return result.join("");
    };
    
    // when building an uri, this is a shorthand for making the
    // get-request string
    var encodeUrlParameters = exports.encodeUrlParameters = function (args) {
        var result = [];
        var name;
        for(name in args) {
            result.push(escapeUri(name) + "=" + escapeUri("" + args[name]));
        }
        return result.join("&");
    }
    
    
    // Function for executing code residing on a remote server
    // - this is used to be able to run browser cross-domain etc.
    var executeRemote = exports.executeRemote = function(url) {
        var scriptTag = document.createElement("script");
        scriptTag.setAttribute("src", url);
        document.getElementsByTagName("head")[0].appendChild(scriptTag);
    };
    
    var global = this;
    // 
    exports.callJsonpWebservice = function(url, callbackParameterName, args, callback) {
        // clone args, as we want to add a jsonp-callback-name-property
        // without altering the original parameter
        args = Object.create(args); 
    
    
        // temporary global callback function, that deletes itself after used
        var callbackName = "_Q_" + uniqId();
        var callbackFn = global[callbackName] = function(data) {
            if(global[callbackName]) {
                global[callbackName] = undefined;
                try {
                    callback(data);
                } catch(e) {
                    callbackError(e);
                }
            }
        }
        // if we haven't got an answer after one minute, assume that an error has occured, 
        // and call the callback, without any arguments.
        setTimeout(callbackFn, 60000);
    
        args[callbackParameterName] = callbackName;
    
        executeRemote(url + "?" + encodeUrlParameters(args));
    }
    
    // END OLD STUFF ////////////////////////////////////////
    
    nextid = 0;
    function uniqId() {
        return "MUI_" + ++nextid;
    }
    
    var pageTransform = transformFactory({html5: true, placeholder: true, telinput: true});
    
    
    exports.storage = localStorage;
    
    var previousPage = undefined;
    
    exports.prevPage = function() {
        return previousPage;
    };
    
    //exports.callJsonpWebservice = Q.callJsonpWebservice;
    
    exports.setMain = function(muiMain) {
        console.log("setmain");
        $('document').ready(function() { 
                console.log("ready");
                muiMain(mui); });
    };
    
    exports.loading = function() {
        $("#loading").css("top", "50px");
    };
    function notLoading() {
        $("#loading").css("top", "-50px");
    }
    
    
    function toHTML(elem) {
        if(Array.isArray(elem)) {
            elem = jsonml.toXml(elem);
        }
        return elem;
    }
    
    exports.showPage = function(elem) {
        if(elem[0] === "page") { 
            elem = pageTransform(elem, this);
            elem = elem.map(jsonml.toXml).join("")
        } else {
            elem = jsonml.toDOM(elem);
        }
        notLoading();
        console.log("slidein", elem);
        $("#current").before(
                             $("<div>").attr("id", "next").append(elem));
        $("#current").css("top", - $("#next").height());
        $("#current").attr("id", "prev");
        $("#next").attr("id", "current");
        setTimeout('$("#prev").remove()', 500);
    }
    
    
    exports.more = function more(fn) {
        $("#morecontainer").append('<div id="more"><a>more...</a></div>');
        function update() {
            $(document).unbind("scroll", onScreen);
            $("#more").html("loading...");
            fn(mui);
        }
        function onScreen() {
            if($("#more").offset().top < window.innerHeight+window.pageYOffset) {
                update();
            } 
        }
        $(document).bind("scroll", onScreen);
        $("#more").bind("click", update);
        onScreen();
    }
    
    exports.append = function(elem) {
        $("#more") && $("#more").remove();
        $("#morecontainer").append(elem);
    }
    
return mui; })({},$);
