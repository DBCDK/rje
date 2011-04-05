require("xmodule").def("muiMidp", function() {

    var mui = {};
    var tickerFn = setTicker;
    setTicker = undefined;
    mui.loading = function() {
        tickerFn("loading...");
    }

    var newForm = newform;
    newform = undefined;
    newForm("Mui App");
    mui.loading();

    var pageTransform = require("muiPage").transformFactory({midp:true});

    mui.callJsonpWebservice = require("Q").callJsonpWebservice; 

    mui.showPage = function(page) {
        console.log("showpage");
        inputelem = {};
        choiceelem = {};
        newForm(page[1].title || "untitled");
        pageTransform(page, mui);
    }

    mui.session = {};
    mui.storage = localStorage;
    exports.setMain = function(muiCallback) {
        muiCallback(mui);
    }
});
