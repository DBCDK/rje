// # Mui HTML5 Backend
require("xmodule").def("muiApp",function(){

    var Q = require("Q");
    var jsonml = require("jsonml");

    var pageTransform = require("muiPage").transformFactory({html5: true, placeholder: true, telinput: true});

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
    __mui__.__callbacks = callbacks;
    __mui__.__call_fn = function(fnid) {
        var callback = callbacks[fnid];
        __mui__.__callbacks = callbacks = {};

        var muiObject = Object.create(mui);
        muiObject.formValue = (function () {
                var form = formExtract(gId("current"), {});
                return function(name) { return form[name]; }
            })();
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
        muiObject.formValue = function() { };

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
