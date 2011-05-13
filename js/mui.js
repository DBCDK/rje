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

    // In a web environment, the session object is just a simple object.
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
            var c = uri[i];
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

    //exports.callJsonpWebservice = Q.callJsonpWebservice;
    var main;

    exports.setMain = function(muiMain) {
        $('document').ready(function() {

            if(typeof localStorage !== undefined) {
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

            main = muiMain;
            muiMain(mui);
        });
    };

    exports.loading = function() {
        $("#loading").css("top", "50px");
    };

    function notLoading() {
        $("#loading").css("top", "-100px");
    }

    function fixup() {
        var $page = $("#next page");
        var title = $page.attr("title");
        if(title) {
            $page.prepend($("<div>").addClass("header").text(title));
        }
        $page.append($("<div>").addClass("contentend"));
        $page.replaceWith($page.contents());

        $("#next section").replaceWith(function() {
            var $result = $("<div>").addClass("contentbox").append($(this).contents());
            if($(this).prop("autocontent")) {
               $result.attr("id", "morecontainer");
               morefn = $(this).prop("autocontent");
            }
            return $result;
        });

        $("#next button").each(function() {
            if(this.fn) {
                $(this).replaceWith(
                    $("<div>").addClass("button").append(
                        $("<a>").append($(this).contents()))
                        .one("click", (function(fn) {
                            return function() { fn(mui); }})(this.fn))
                );
            }
        });

        $("#next input").each(function() {
            var $this = $(this);

            var $t = $('<div class="input">');
            $this.replaceWith($t);
            $t.append($this);

            var type = $this.attr("type");
            var name = $this.attr("name");
            var label = $this.prop("label");
            var hint = $this.prop("hint");

            if(type === "textbox") {
                var $new = $("<textarea>");
                $new.attr("name", name)
                    .val($this.val());
                $this.replaceWith($new);
                $this = $new;
            } 

            if(hint) {
                $this.after($('<div class="hint">').text("* " + hint));
            }

            $this.attr("id", "MUI_FORM_" + name);

            // TODO: modernizr placeholder degradation
            $this.attr("placeholder", label);

            //$this.replaceWith($('<div class="input">').append($this));
        });

        $("#next choice").replaceWith(function() {
            $this = $(this);
            var name = $this.prop("name");
            $result = $("<select>").attr("name", name)
                        .append('<option value="">' + $this.prop("label") + "</option>")
                        .append($this.contents()).val($this.prop("value"));
            $result.attr("id", "MUI_FORM_" + name);

            return $('<div class="input">').append($result);
        });
    }

    exports.showPage = function(elem) {
        previousPage = elem;
        $(document).unbind('scroll');
        $("#current").before($("<div>").attr("id", "next"));
        elem = jsonml.toDOM(elem);
        $("#next").append(elem);
        fixup();
        notLoading();
        $("#current").css("top", -$("#next").height()).attr("id", "prev");
        $("#next").attr("id", "current");
        if ($("#current #morecontainer")) {
            mui.more(morefn);
        }
        setTimeout('$("#prev").remove()', 500);
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
