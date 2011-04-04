// # Mui HTML5 Backend
require("xmodule").def("muiApp",function(){

    Q = require("Q");
    jsonml = require("jsonml");
    if(typeof localStorage === "undefined") {
        require("phonegap");
    }

    // mui object, arguments to Mui Callbacks will be clones of this.
    // Also added as a global `__mui__`, where we store named callbacks.
    var mui = global.__mui__ = {};

    // Error to show, when something goes wrong
    function callbackError(e) {
                mui.showPage(["page", {title: "Error"}, 
                    ["text", e.toString()],
                    ["button", {fn: main}, "Back to start"]
                    ]);
                throw e;
    }

    // Jsonp access is just the function defined in Q
    mui.callJsonpWebservice = Q.callJsonpWebservice;

    // In a web environment, the session object is just a simple object.
    mui.session = {};

    // move a loading indicator onto the screen
    mui.loading = function() {
        window.scroll(0,0);
        gId("loading").style.top = "50px";
    };

    exports.showPage = mui.showPage = function(page) {
        // hide loading indicator
        gId("loading").style.top = "-50px";

        if(page[0] !== "page") {
            throw("Parameter to showPage must be a jsonml 'page'");
        } 
        showHTML(pageTransform(page));
    };
    
    // Generate an uniq id - probably move this to Q
    uniqId = (function() {
        var id = 0;
        return function() {
            return "__mui_id_" + id++;
        }
    })();
    
    // feature detection, should be merged with Q.features  
    var features = {
        placeholder: true,
        telInput: true
    };

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
                var value =  jsonml.getAttr(node, "value") || "";
                if(features.placeholder) {
                    tagAttr.placeholder = jsonml.getAttr(node, "label");
                }
                if(type === "textbox") {
                    result.push(["textarea", tagAttr, value]);                
                } else if(type === "email" || type === "text") {
                    tagAttr.type = type;
                    tagAttr.value = value;
                    result.push(["input", tagAttr]);
                } else if(type === "tel") {
                    if(features.telInput) {
                        tagAttr.type = type;
                    } else {
                        tagATtr.type = "number";
                    }
                    tagAttr.value = value;
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
                var defaultValue =  jsonml.getAttr(node, "value") || "";
    
                var name = jsonml.getAttr(node, "name");
                if(!name) {
                    throw "choice widgets must have a name attribute";
                }

                var select = ["select", {"name": jsonml.getAttr(node, "name")}];
                jsonml.childReduce(node, function(html, node) {
                    if(node[0] !== "option") {
                        throw "only option nodes are allows as children to choices";
                    }
                    var value =  jsonml.getAttr(node, "value");
                    if(!value) {
                        throw "option widgets must have a value attribute";
                    }
                    var attrs = { value : value };
                    if(value === defaultValue) {
                        attrs.selected = "true";
                    }
                    select.push(["option", attrs, node[2]]);
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

    // calculate height of dom element
    function height(dom) {
        return document.defaultView.getComputedStyle(dom, "").getPropertyValue("height");
    }
    
    // shorthand
    function gId(name) {
        return document.getElementById(name);
    }
    
    // shorthand
    function domRemove(node) {
        node && node.parentNode.removeChild(node);
    }
    
    // html is a list of jsonml arrays, which is transformed to xml,
    // and inserted in a div in the body. We have a current and a next-div
    // to be able to make a slide effect.
    function showHTML(html) {
        next = document.createElement("div");
        next.setAttribute("id", "next");
        next.innerHTML = html.map(jsonml.toXml).join('');
        var current = gId("current");
        gId("container").insertBefore(next, current);
        // we have a relative layout, so when inserting a new div
        // in the beginning, we must also move the next div up,
        // such that it is at the top.
        current.style.top = "-" + height(next);
        setTimeout(slidein, 0);
    }
    
    function removePrev() {
        domRemove(gId("prev"));
    }
    // fancy looking slidein effect.
    // Remove the prev-div, and then move current to prev, and next to current.
    function slidein() {
        window.scroll(0,0);
    
        removePrev();
    
        gId("current").setAttribute("id", "prev");
    
        var next = gId("next");
        next.setAttribute("id", "current");
        // make sure that the container can contain the largest of the divs
        gId("container").style.height = Math.max(parseInt(height(next), 10), window.innerHeight) + "px";
        setTimeout(removePrev, 500);
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
    
    

    var initialised = false;
    function muiInit() {
        var scriptTag = document.createElement("link");
        scriptTag.setAttribute("rel", "stylesheet");
        scriptTag.setAttribute("href", "mui/muiApp.css");

        if(typeof localStorage === "undefined") {
            try {
                if (typeof window.openDatabase == "undefined") {
                    navigator.openDatabase = window.openDatabase = DroidDB_openDatabase;
                    window.droiddb = new DroidDB();
                }
                mui.storage = navigator.localStorage = window.localStorage = new CupcakeLocalStorage();
                PhoneGap.waitForInitialization("cupcakeStorage");
            } catch(e) {
                alert(e);
                throw e;
            }
        } else {
            mui.storage = localStorage;
        }

        document.getElementsByTagName("head")[0].appendChild(scriptTag);

        document.getElementsByTagName("body")[0].innerHTML = ('<div id="container"><div id="current"></div><div id="prev"></div><div id="loading">loading...</div></div>');
        initialised = true;
        if(main) {
            muiMain();
        }
    }

    function muiMain() {
        var muiObject = Object.create(mui);
        muiObject.form = {};

        try {
            main(muiObject);
        } catch(e) {
            callbackError(e);
        }
    }

    var main;

    exports.setMain = mui.setMain = function(fn) {
        main = fn;
        if(initialised) {
            muiMain();
        }
    };

    // This works in more cases than window.onload
    (function waitForReady() {
        if(document.readyState !== "loading") {
            muiInit();
        } else {
            setTimeout(waitForReady, 20);
        }
    })();

});
