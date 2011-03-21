mui = {};


exports = {};
document.write('<script src="jsonml.js"></script>');
document.write('<link rel="stylesheet" href="mui.css"></script>');
jsonml = exports;

if (!Object.create) {
    Object.create = function(o) {
        var C = function () {};
        C.prototype = o;
        return new C;
    };
}

__mui__ = {};

(function(){
    var mui = __mui__;
    var global = this;

    mui.loading = function() {
        gId("loading").style.top = "50px";
    };

    mui.callJsonpWebservice = function(url, callbackParameterName, args, callback, timeout) {
        // clone args, as we want to add a jsonp-callback-name-property
        // without altering the original parameter
        args = Object.create(args); 

        // temporary global callback function, that deletes itself after used
        var callbackName = uniqId();
        global[callbackName] = function(data) {
            delete global[callbackName];
            callback(data);
        }
        args[callbackParameterName] = callbackName;
        args.cacheBust = ""+Math.random();

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
    mui.showPage = function(page) {
        gId("loading").style.top = "-50px";
        if(page[0] !== "page") {
            throw("Parameter to showPage must be a jsonml 'page'");
        } 
        showHTML(pageTransform(page));
    };
    
    var dispatch = function() { throw "Dispatch function not defined. Remember to call mui.setDispatch. Before showing ui-elements that may call back"; };
    
    mui.setDispatch = function(dispatchFunction) {
        dispatch = dispatchFunction;
    };
    uniqId = (function() {
        var id = 0;
        return function() {
            return "__mui_id_" + id++;
        }
    })();

    
    function pageTransform(page) {

        var handlers = {
            inputarea: function(html, node) {
                var result = ["div", {"class": "contentbox"}];
    
                var labelid = uniqId();
                if(jsonml.getAttr(node, "label")) {
                    result.push(["div", {"class": "label"}, ["label", {"for": labelid}, jsonml.getAttr(node, "label"), ":"]]);
                }

                var name = jsonml.getAttr(node, "name");
                if(!name) {
                    throw "inputarea widgets must have a name attribute";
                }
    
                result.push(["textarea", {"id": labelid, "name": name}, ""]);
                html.push(result);
            },
            choice: function(html, node) {
                var result = ["div", {"class": "contentbox"}];
    
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
                var result = ["div", {"class": "contentbox"}];
                jsonml.childReduce(node, nodeHandler, result);
                html.push(result);
            },
            button: function(html, node) {
                if(!jsonml.getAttr(node, "id")) {
                    throw "buttons must have an id attribute";
                }
                var attr = {"class": "button", onclick: "__mui__.__handleEvent('button','" + jsonml.getAttr(node, "id") + "');"};
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
        node.parentNode.removeChild(prev);
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
        if(name) {
            var tag = node.tagName;
            if(tag === "TEXTAREA") {
                acc[name] = node.value;
            } else if(tag === "SELECT") {
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
    
    mui.__handleEvent = function(type, id) {
        var muiObject = Object.create(mui);
        if(type==="button" && typeof id === "string") {
            muiObject.event = id;
            muiObject.form = formExtract(gId("current"), {});
            muiCallback(muiObject);
        } else {
            throw "invalid mui event: " + type;
        }
    };
    function main() {
        var muiObject = mui;
        muiObject.event = "start";
        muiCallback(muiObject);
    }

    document.write('<div id="container"><div id="current"></div><div id="prev"></div><div id="loading">loading...</div></div>');

    window.onload=main;
})();
