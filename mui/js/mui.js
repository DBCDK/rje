// # Mobile User Interface
//
window.mui = (function(exports, global) {
    /*global $, jsonml, document, localStorage, setTimeout, window */
    "use strict";
    var mui = exports;

    // function for autoexpanding section on page
    var morefn;

    // storage session variables, only used client side
    mui.session = {};

    mui.storage = {};

    // variable to keep track of the previous. 
    // Practical for hinting on misfilled forms.
    mui.prevPage = function() {
        return this.previousPage;
    };


    // ----

    // ## Insert hints on form
    // Update hints on input elements on a page.
    // This is usefull for example if a form is filled out
    // wrongly, and the user should be notified, ie:
    // `mui.showPage(mui.setHints(mui.prevPage(), {"username": "Please enter a user name"}));`
    exports.setHints = function setHints(page, hints) {
        if (Array.isArray(page)) {
            var attr = page[1];
            if (attr && attr.name) {
                if (this.formValue(attr.name) || attr.value) {
                    attr.value = this.formValue(attr.name);
                }
                if (hints[attr.name]) {
                    attr.hint = hints[attr.name];
                } else if (attr.hint) {
                    delete attr.hint;
                }
            }

            for (var i = 1; i < page.length; ++i) {
                this.setHints(page[i], hints);
            }
        }
        return page;
    };

    // ----


    // ## Get the value of a form element
    // Notice: server-side execution of mui overwrites this function.

    exports.formValue = function(name) {
        return $("#MUI_FORM_" + name).val();
    };

    // ## Jsonp requests
    /**/ 
    // ### Utility functions for URI encoding 
    // Valid characters in URIs
    var urichars = '1234567890abcdefghijklmnopqrstuvwxyz' 
        + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ-_~.';

    // Workaround for buggy uri-escape in EcmaScript.
    // Escape an uri in a way that is compatible with web-clients/servers
    //
    // Seems like the browser-behaviour is to %-encode non-url-ascii-symbols
    // and xml escape larger unicode (which then also needs to be %-encoded). 
    var escapeUri = exports.escapeUri = function(uri) {
        var result = [];
        for (var i = 0; i < uri.length; ++i) {
            var c = uri.charAt(i);
            if (urichars.indexOf(c) >= 0) {
                result.push(c);
            } else {
                c = c.charCodeAt(0);
                if (c > 127) {
                    result.push(escapeUri("&#" + c + ";"));
                } else {
                    result.push("%" + (c < 16 ? "0" : "") + c.toString(16));
                }
            }
        }
        return result.join("");
    };

    // Encoding of parameters after the ? in a GET-request.
    // When building an uri, this is a shorthand for making the
    // get-request string
    var encodeUrlParameters = exports.encodeUrlParameters = function(args) {
        var result = [];
        var name;
        for (name in args) {
            result.push(escapeUri(name) + "=" + escapeUri("" + args[name]));
        }
        return result.join("&");
    };

    // ### Function for calling a jsonp-api
    // Just a wrapper of jquery, with our escape and syntax
    // (which were defined before we started to use jquery)
    exports.callJsonpWebservice = 
            function(url, callbackParameterName, args, callback) {
        url = url + "?" + encodeUrlParameters(args) + "&" 
            + callbackParameterName + "=?";
        $.ajax(url, { dataType: "jsonp", success: callback, 
            error: function() { callback(); } });
    };

    // ## Main function
    // `exports.main` will be a user-supplied main function,
    // that will be called when the document is ready.
    // If the function hasn't been supplied before it is called,
    // this wrapper function makes sure that it will be called,
    // when it is supplied.
    exports.main = function(mui) { exports.setMain = function(fn) { 
        exports.main = fn;
        fn(mui); 
    };};

    // Function for setting the main function, - should be called once
    // by the user application.
    exports.setMain = function(fn) { exports.main = fn; };

    // ----

    function start() {
        console.log("start");
        if(typeof localStorage !== "undefined") {
            exports.storage = localStorage;
        } else {
            var store = {};
            exports.storage = {
                setItem: function(key, val) {
                    store[key] = val;
                },
                getItem: function(key) {
                    return store[key];
                }
            };
        }
        if(!$.mobile) {
            $("body").append('<div id="container"><div id="current"></div>' 
                    + '<div class="contentend"></div></div>' 
                    + '<div id="loading">Loading...</div>');
        }
        exports.main(exports);
    };

    if(window.PhoneGap && window.PhoneGap.device) {
        console.log("start A");
        document.addEventListener("deviceready", 
                function() { $(start); }, false);
    } else {
        console.log("start B");
        $(start);
    }


    exports.loading = function() {
        if($.mobile) {
            $.mobile.pageLoading();
        } else {
            $("#loading").css("top", "50px");
        }
    };

    function notLoading() {
        if($.mobile) {
            $.mobile.pageLoading(true);
        } else {
            $("#loading").css("top", "-100px");
        }
    }

    // ----

    // # Page transformation
    /**/

    // forward declaration of transform function, needed for jshint
    var transform;

    // run the transform function on all the child nodes of `src` 
    // and append the result to `dst`
    function childTransform(dst, src) {
        for(var i=2;i<src.length;++i) {
            dst.push(transform(src[i]));
        }
        return dst;
    }

    // add a class to a html/jsonml node
    function classExtend(attr, className) {
        if(attr["class"]) {
            attr["class"] += " " + className;
        } else {
            attr["class"] = className;
        }
        return attr;
    }

    // The actual transformation code. 
    // Takes a jsonml tree as parameter, and returns a new one.
    // It assumes that the jsonml is normalised,
    // ie. contains a (possibly empty) attribute object
    // at elem[1]. 
    transform = function transform(elem) {
        if(!Array.isArray(elem)) {
            return elem;
        }

        var result;
        var tag = elem[0];
        // copy the attr, to make sure we do not modify the attributes in place
        var attr = jQuery.extend({}, elem[1]);

        if(tag === "page") {
            return ["div", {"data-role": "page", id: "current"},
                ["div", {"data-role": "header", "class": "header"}, 
                ["h1", attr.title || "untitled"]],
                childTransform(["div", {"data-role": "content"}], elem), 
                    ["div", {"class": "contentend"}]];

        } else if(tag === "section") {
            tag = "div";
            classExtend(attr, "contentbox");
            if(attr.autocontent) {
               $("#morecontainer").attr("id", "");
               attr.id = "morecontainer";
               morefn = attr.autocontent;
            }

        } else if(tag === "button" && attr.fn) {
            if(window.ssjs) {
                var text = elem.slice(2).join("");
                window.ssjs.buttonName(text, attr.fn);
                return ["input", 
                        {"type": "submit", "name": "_B", "value": text}];
            }
            attr = {"onclick": 
                (function(fn) { return function() { fn(mui); }; })(attr.fn)};
            if(!$.mobile) {
                classExtend(attr, "button");
                tag = "div";
            }

        } else if(tag === "input") {
            result = ["div",  {"data-role": "fieldcontain", "class": "input"}];
            attr.id = "MUI_FORM_" + attr.name;

            if($.mobile) {
                if(attr.label) {
                    result.push(["label", {"for": attr.id}, attr.label]);
                } 
            } else {
                attr.placeholder = attr.label;
            }

            if(attr.type !== "textbox") {
                result.push([tag, attr]);
            }  else {
                result.push(["textarea", attr, attr.value || ""]);
            }

            if(attr.hint) {
                result.push(["div", {"class": "hint"}, "*", attr.hint]);
            }

            return result;

        } else if(tag === "choice") {
            result = ["div", {"data-role": "fieldcontain"}];
            attr.id = "MUI_FORM_" + attr.name;

            if($.mobile) {
                if(attr.label) {
                    result.push(["label", {"for": attr.id}, attr.label]);
                } 
                var select = childTransform(["select", attr], elem);
            }  else {
                var select = childTransform(["select", attr, 
                        ["option", {value: ""}, attr.label]], elem);
            }

            for(var i=2;i<select.length;++i) {
                if(attr.value === select[i][1].value) {
                    attr.selectedIndex = i-2;
                }
            }
            result.push(select);
            return result;
        }
        return childTransform([tag, attr], elem);
    };

    // # Logic to render the page on "screen"

    exports.showPage = function(elem) {
        console.log("showPage");
        this.previousPage = elem;
        $(document).unbind('scroll');
        $("#morecontainer").attr("id", "");
        $("#more").attr("id", "");
        $("#current").attr("id", "prev");
        elem = jsonml.withAttr(elem);
        elem = transform(elem);
        elem = jsonml.toDOM(elem);
        notLoading();
    
        if(window.ssjs) {
            $("body").html($(elem));

        } else if($.mobile) {
            console.log("body-append");
            $("body").append($(elem));
            console.log("body-append2");
            $.mobile.changePage($(elem));
            console.log("body-append-done");
    
        } else {
            $("#prev").before($(elem).attr("id", "next"));
            $("#prev").css("top", -$("#next").height());
            $("#next").attr("id", "current");
        }

        if ($("#morecontainer")) {
            if(morefn) morefn(this);
            /* mui.more(morefn); */
        }

        if(window.ssjs) {
            window.ssjs.send();
        } else {
            setTimeout(function() {$("#prev").remove();}, 2000);
        }
    };

    function updateLayout() {
        if($("#prev")) {
            $("#prev").css("top", -$("#current").height());
        }
    }

    // # Autoexpanding div, ie. search results
    exports.more = function more(fn) {
        $("#morecontainer").append('<div id="more"><a>more...</a></div>');

        var onScreen;
        function update() {
            $(document).unbind("scroll", onScreen);
            $("#more").html("loading...");
            updateLayout();
            fn(mui);
        }

        onScreen = function onScreen() {
            if ($("#more").offset() && $("#more").offset().top 
                    < window.innerHeight + window.pageYOffset) {
                update();
            }
        };
        $(document).bind("scroll", onScreen);
        $("#more").bind("click", update);
        onScreen();
    };

    exports.append = function(elem) {
        if($("#more")) {
            $("#more").remove();
        }
        $("#morecontainer").append($("<div>").append(elem));
        updateLayout();
    };

    // # End of file
    return mui;
})({}, this /*global*/);
