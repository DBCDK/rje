var mui = (function(exports, $, global) {
    var mui = exports;

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
    }

    var morefn = undefined;

    mui.session = {};

    exports.formValue = function(name) {
        return $("#MUI_FORM_" + name).val();
    };

    // Valid characters in URIs
    var urichars = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_~.";

    // An uri.
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

    // when building an uri, this is a shorthand for making the
    // get-request string
    var encodeUrlParameters = exports.encodeUrlParameters = function(args) {
        var result = [];
        var name;
        for (name in args) {
            result.push(escapeUri(name) + "=" + escapeUri("" + args[name]));
        }
        return result.join("&");
    }


    exports.callJsonpWebservice = function(url, callbackParameterName, args, callback) {
        url = url + "?" + encodeUrlParameters(args) + "&" + callbackParameterName + "=?";
        $.ajax(url, { dataType: "jsonp", success: callback, error: function() { callback(); } });
    }

    exports.storage = {};

    var previousPage = undefined;

    exports.prevPage = function() {
        return previousPage;
    };

    exports.setMain = function(fn) { main = fn; };
    var main = function(mui) { exports.setMain = function(fn) { fn(mui); }};
    var startme = false;
    $(document).ready(function() {
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
            }
        }
        main(exports);
     });

    exports.loading = function() {
        $.mobile.pageLoading();
    };

    function childTransform(dst, src) {
        for(var i=2;i<src.length;++i) {
            dst.push(transform(src[i]));
        }
        return dst;
    }

    function transform(elem) {
        if(!Array.isArray(elem)) {
            return elem;
        }

        var tag = elem[0];
        var attr = elem[1];

        if(tag === "page") {
            return ["div", {"data-role": "page", id: "current"},
                ["div", {"data-role": "header"}, ["h1", attr.title || untitled]],
                childTransform(["div", {"data-role": "content"}], elem)];

        } else if(tag === "section") {
            tag = "div";
            if(attr.autocontent) {
               $("#morecontainer").attr("id", "");
               attr.id = "morecontainer";
               morefn = autocontent("autocontent");
            }

        } else if(tag === "button" && attr.fn) {
            attr = {"onclick": (function(fn) { return function() { fn(mui) } })(attr.fn)};

        } else if(tag === "input") {
            var result = ["div", /* {"data-role": "fieldcontain"} */]
            attr.id = "MUI_FORM_" + attr.name;

            /* if(attr.label) {
                result.push(["label", {"for": attr.id}, attr.label, ":"]);
            } */
            attr.placeholder = attr.label;

            if(attr.type !== "textbox") {
                result.push([tag, attr])
            }  else {
                result.push(["textarea", attr, attr.value || ""])
            }

            if(attr.hint) {
                result.push(["div", {"class": "hint"}, "*", attr.hint])
            }

            return result;

        } else if(tag === "choice") {
            var result = ["div", /* {"data-role": "fieldcontain"} */];
            attr.id = "MUI_FORM_" + attr.name;

            var select = childTransform(["select", attr, ["option", {value: ""}, attr.label]], elem);
            for(var i=2;i<select.length;++i) {
                if(attr.value === select[i][1].value) {
                    attr.selectedIndex = i-2;
                }
            }
            result.push(select);
            return result;
        } 
        return childTransform([tag, attr], elem);
    }

    exports.showPage = function(elem) {
        previousPage = elem;
        //$(document).unbind('scroll');
        elem = jsonml.withAttr(elem);
        elem = transform(elem);
        elem = jsonml.toDOM(elem);

        $("#current").attr("id", "prev");
        setTimeout(function() {$("#prev").remove()}, 500);

        $current = $(elem);
        $("body").append($current);
        $.mobile.changePage($current);

        //if ($("#current #morecontainer")) {
        //    mui.more(morefn);
        //}
    }

    function updateLayout() {
        $("#prev") && $("#prev").css("top", -$("#current").height())
    }

    exports.more = function more(fn) {
        $("#morecontainer").append('<div id="more"><a>more...</a></div>');

        function update() {
            $(document).unbind("scroll", onScreen);
            $("#more").html("loading...");
            updateLayout();
            fn(mui);
        }

        function onScreen() {
            if ($("#more").offset() && $("#more").offset().top < window.innerHeight + window.pageYOffset) {
                update();
            }
        }
        $(document).bind("scroll", onScreen);
        $("#more").bind("click", update);
        onScreen();
    }

    exports.append = function(elem) {
        $("#more") && $("#more").remove();
        $("#morecontainer").append($("<div>").append(elem));
        updateLayout();
    }

    return mui;

})({}, $, this /*global*/);
