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
    mui.callJsonpWebservice = require("Q").callJsonpWebservice; 

    function childReduce(arr, fn, acc) {
        if(!Array.isArray(arr)) {
            console.log("Error: childReduce expected array, got:", arr);
        }
        var first = arr[1];
        if(typeof(first) === "object" && Array.isArray(first)) {
            acc = fn(acc, first);
        }
        for(var i=2; i < arr.length; ++i) {
            acc = fn(acc, arr[i]);
        }
        return acc;
    }
    var inputelem;
    var choiceelem;
    function showSubPage(acc, p) {
        if(Array.isArray(p)) {
            var type = p[0];
            if(type == "section") {
                childReduce(p, showSubPage);
            } else if(type == "input") {
                types = {
                    textbox: { type: 0, len: 5000},
                    email: {type: 1, len: 20},
                    tel: { type: 3, len: 20}
                    };
                type = types[p[1].type];
                inputelem[p[1].name] = textfield(p[1].label || "", type.len, type.type);
            } else if(type == "text") {
                stringitem(p[1]);
            } else if(type == "button") {
                addbutton(p[2], 
                    function() {
                        mui.form = {};
                        for(name in inputelem) {
                            mui.form[name] = textvalue(inputelem[name]);
                        }
                        for(name in choiceelem) {
                            mui.form[name] = choiceelem[name][1+choiceno(choiceelem[name][0])];
                        }
                        console.log("mui.form", mui.form);
                        p[1].fn(mui);
                    });
            } else if(type == "choice") {
                var c = choice(p[1].label || "");
                var a = [c];
                choiceelem[p[1].name] = a;
                childReduce(p, function(_, elem) {
                    addchoice(c, elem[2]);
                    a.push(elem[1].value);
                });
            } else {
                console.log("Unexpected page element:", type);
            }
        } else {
            console.log("Unexpected page element:", p);
        }
    }

    mui.showPage = function(page) {
        inputelem = {};
        choiceelem = {};
        newForm(page[1].title || "untitled");
        childReduce(page, showSubPage);
    }

/*
    newform("Hello world");
    var t = textfield("textbox", 5000, 0);
    textfield("email", 40, 1);
    textfield("tel", 20, 3);
    var c = choice("choice...");
    addchoice(c, "a");
    addchoice(c, "b");
    addchoice(c, "c");
    addbutton("foo", function() { console.log("foo", textvalue(t)); });
    addbutton("bar", function() { console.log("bar", choiceno(c)); });
    stringitem("helo");
    */

    mui.loading();
    mui.session = {};
    mui.storage = localStorage;
    exports.setMain = function(muiCallback) {
        muiCallback(mui);
    }
});
