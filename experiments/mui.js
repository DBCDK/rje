mui = (function(exports, $) {
    var mui = exports;
    nextid = 0;
    function uniqId() {
        return "MUI_" + ++nextid;
    }

    var pageTransform = muiPage.transformFactory({html5: true, placeholder: true, telinput: true});


    exports.storage = localStorage;
    exports.formValue = function() {
        throw "TODO";
    };
    exports.setHints = function() {
        throw "TODO";
    };
    exports.prevPage = function() {
        throw "TODO";
    };
    exports.callJsonpWebservice = function () {
        throw "TODO";
    };
    exports.setMain = function() {
        throw "TODO";
    };


    function toHTML(elem) {
        if(Array.isArray(elem)) {
            elem = jsonml.toXml(elem);
        }
        return elem;
    }

    exports.showPage = function(elem) {
        elem = pageTransform(elem, this);
        console.log("slidein", JSON.stringify(elem));
        $("#current").before(
            $("<div>").attr("id", "next").html(elem.map(jsonml.toXml).join("")));
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
