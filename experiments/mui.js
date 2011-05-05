mui = (function(exports, $) {
    var mui = exports;

// OLD STUFF TO BE REFACTORED ////////////////////////////////

    __mui__ = mui;

    // In a web environment, the session object is just a simple object.
    mui.session = {};
    mui.setHints = muiPage.setHints;
                    

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




// END OLD STUFF ////////////////////////////////////////

    nextid = 0;
    function uniqId() {
        return "MUI_" + ++nextid;
    }

    var pageTransform = muiPage.transformFactory({html5: true, placeholder: true, telinput: true});


    exports.storage = localStorage;

    var previousPage = undefined;

    exports.prevPage = function() {
        return previousPage;
    };

    exports.callJsonpWebservice = Q.callJsonpWebservice;

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

    return mui;
})({},$);
