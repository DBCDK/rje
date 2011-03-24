require("xmodule").def("muiApp",function(){


document.write('<link rel="stylesheet" href="mui/muiApp.css"></script>');

jsonml = require("jsonml");

if (!Object.create) {
    Object.create = function(o) {
        var C = function () {};
        C.prototype = o;
        return new C;
    };
}

    var global = (function () { return this })();
    global.__mui__ = {};
    var mui = global.__mui__;

    var features = {
        placeholder: true,
        telInput: true
    };

    function callbackError(e) {
                mui.showPage(["page", {title: "Error"}, 
                    ["text", e.toString()],
                    ["button", {fn: main}, "Back to start"]
                    ]);
                throw e;
    }

    exports.loading = mui.loading = function() {
        window.scroll(0,0);
        gId("loading").style.top = "50px";
    };

    exports.loading = mui.callJsonpWebservice = function(url, callbackParameterName, args, callback) {
        // clone args, as we want to add a jsonp-callback-name-property
        // without altering the original parameter
        args = Object.create(args); 

        // temporary global callback function, that deletes itself after used
        var callbackName = uniqId();
        var callbackFn = global[callbackName] = function(data) {
            if(global.hasOwnProperty(callbackName)) {
                delete global[callbackName];
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

        var fullUrl = url + "?" + argsUrlEncode(args);
        var scriptTag = document.createElement("script");
        scriptTag.setAttribute("src", fullUrl);
        document.body.appendChild(scriptTag);
    }
    function argsUrlEncode(args) {
        var result = [];
        for(name in args) {
            result.push(escapeFixed(name) + "=" + escapeFixed(args[name]));
        }
        return result.join("&");
    }

    // Fixed uri escape. JavaScripts escape, encodeURI, ... are buggy.
    function escapeFixed(uri) {
        uri = uri.replace(/[^a-zA-Z0-9-_~.]/g, function(c) {
            c = c.charCodeAt(0);
            if(c > 255) {
                return escapeFixed("&#" + c + ";");
            } else {
                return "%" + c.toString(16);
            }
        });
        return uri;
    };

    
    // # Mobile user interface - html5 version
    exports.showPage = mui.showPage = function(page) {
        gId("loading").style.top = "-50px";
        if(page[0] !== "page") {
            throw("Parameter to showPage must be a jsonml 'page'");
        } 
        showHTML(pageTransform(page));
    };
    
    var main = function() { throw "main function not defined. Remember to call mui.setMain" };
    
    exports.setMain = mui.setMain = function(fn) {
        main = fn;
    };
    uniqId = (function() {
        var id = 0;
        return function() {
            return "__mui_id_" + id++;
        }
    })();
    
    function pageTransform(page) {
        var handlers = {
            section: function(html, node) {
                var result = ["div", {"class": "contentbox input"}];
                jsonml.childReduce(node, nodeHandler, result);
                html.push(result);
            },
            input: function(html, node) {
                var result = ["div", {"class": "input"}];
                var type = jsonml.getAttr(node, "type");
                if(!type) {
                    throw "input widgets must have a type attribute";
                }
                var name = jsonml.getAttr(node, "name");
                if(!name) {
                    throw "input widgets must have a name attribute";
                }

                var labelid = uniqId();
                if(features.placeholder === true) {
                } else {
                  if(jsonml.getAttr(node, "label")) {
                    result.push(["div", {"class": "label"}, ["label", {"for": labelid}, jsonml.getAttr(node, "label"), ":"]]);
                  }
                }

                var tagAttr = {"class": type, "id": labelid, "name": name};
                if(features.placeholder) {
                    tagAttr.placeholder = jsonml.getAttr(node, "label");
                }
                if(type === "textbox") {
                    result.push(["textarea", tagAttr, ""]);                
                } else if(type === "email" || type === "text") {
                    tagAttr.type = type;
                    result.push(["input", tagAttr]);
                } else if(type === "tel") {
                    if(features.telInput) {
                        tagAttr.type = type;
                    } else {
                        tagATtr.type = "number";
                    }
                    result.push(["input", tagAttr]);
                } else {
                    throw "unknown input type: " + type;
                }
                html.push(result);
            },
            choice: function(html, node) {
                var result = ["div", {"class": "input"}];
    
                var labelid = uniqId();
                if(jsonml.getAttr(node, "label")) {
                    result.push(["div", {"class": "label"}, ["label", {"for": labelid}, jsonml.getAttr(node, "label"), ":"]]);
                }
    
                var name = jsonml.getAttr(node, "name");
                if(!name) {
                    throw "choice widgets must have a name attribute";
                }
                var select = ["select", {"name": jsonml.getAttr(node, "name")}];
                jsonml.childReduce(node, function(html, node) {
                    if(node[0] !== "option") {
                        throw "only option nodes are allows as children to choices";
                    }
                    if(!jsonml.getAttr(node, "value")) {
                        throw "option widgets must have a value attribute";
                    }
                    select.push(["option", {"value": jsonml.getAttr(node, "value")}, node[2]]);
                    return html;
                }, result);
                result.push(select);
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
                callbacks[fnid] = jsonml.getAttr(node, "fn");
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
    }

    function height(dom) {
        return document.defaultView.getComputedStyle(dom, "").getPropertyValue("height");
    }
    
    function gId(name) {
        return document.getElementById(name);
    }
    
    function domRemove(node) {
        node.parentNode.removeChild(node);
    }
    
    function showHTML(html) {
        next = document.createElement("div");
        next.setAttribute("id", "next");
        next.innerHTML = html.map(jsonml.toXml).join('');
        var current = gId("current");
        gId("container").insertBefore(next, current);
        current.style.top = "-" + height(next);
        setTimeout(slidein, 0);
    }
    
    function slidein() {
        window.scroll(0,0);
    
        domRemove(gId("prev"));
    
        gId("current").setAttribute("id", "prev");
    
        var next = gId("next");
        next.setAttribute("id", "current");
    
        gId("container").style.height = Math.max(parseInt(height(next), 10), window.innerHeight) + "px";
    }

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
    __mui__.__call_fn = function(fnid) {
        callback = callbacks[fnid];
        callbacks = {};

        var muiObject = Object.create(mui);
        muiObject.form = formExtract(gId("current"), {});
        try {
            callback(muiObject);
        } catch(e) {
            callbackError(e);
        }
    }
    
    
    mui.form = {};

    function muiMain() {
        var muiObject = Object.create(mui);
        try {
            main(muiObject);
        } catch(e) {
            callbackError(e);
        }
    }

    
    // FIXME
    setTimeout(muiMain, 500);

    document.write('<div id="container"><div id="current"></div><div id="prev"></div><div id="loading">loading...</div></div>');
});
