require.paths.unshift('.')
http = require('http');
jsonml = require('jsonml');
_ = require('underscore')._;
app = require('app');

// # Utility functions

// Async retrieve an url
function urlFetch(url, callback) {
    var result = [];
    if(url.slice(0,7) !== "http://") {
        throw "not http!";
    }
    url = url.slice(7);
    var i = url.indexOf("/");
    if(i === -1) {
        host = url;
        path = "/";
    } else {
        host = url.slice(0, i);
        path = url.slice(i);
    }
    var client = http.createClient(80, host);
    var request = client.request('GET', path, {'host': host});
    request.end();

    request.on('response', function (response) {
        response.on('data', function(chunk) { result.push(chunk); });
        response.on('end', function() { callback(result.join("")) });
    });
}


// Fixed uri unescape. JavaScripts unescape, decodeURI, ... are buggy.
// This one should work. Used to decode parameters passed through the url.
// 
// FLAW: may also decode xml numeric entities - these seems to be
// autoencode by browsers, ie. with chinese symbols etc.
function unescapeFixed(uri) {
    uri = uri.replace(/((\+)|%([0-9a-fA-F][0-9a-fA-F]))/g, 
            function(_1,_2,plus,hexcode) { 
        if(plus) {
            return " ";
        } else {
            return String.fromCharCode(parseInt(hexcode, 16));
        }
    })
    uri = uri.replace(/&#([0-9][0-9][0-9]*);/g, function(_, num) { 
            return String.fromCharCode(parseInt(num, 10)); 
    });
    return uri;
}

// Fixed uri escape. JavaScripts escape, encodeURI, ... are buggy.
// This one should work. Used for
function escapeFixed(uri) {
    console.log(uri);
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

// # UI builder, make html from the gui-xml
//
// TODO: make sure all use of html is encapsulated here.

// ui -> html mapper
// 
// TODO: use jsonml util function here instead possibly get rid of this function
function uiChildren(ui) {
    var pos;
    var result = [];
    if(_.isArray(ui[1]) || typeof ui[1] !== "object") {
        pos = 1;
    } else {
        pos = 2;
    }
    while(pos < ui.length) {
        if(_.isArray(ui[pos])) {
            result.push(ui2html(ui[pos]));
        } else {
            result.push(ui[pos]);
        }
        ++pos;
    }
    return result;
}

// internal function that lets a ui/html tag
// pass through, preserving the class,
// and transforming the child nodes
function uipassthrough(ui) {
    var result = [ui[0]];
    if(ui[1] && ui[1]['class']) {
        result.push({'class': ui[1]['class']});
    };
    jsonml.pushMappedChild(ui, ui2html, result);
    return result;
}

// internal table of functions that maps from ui elements to html
var ui_table = {
    div: uipassthrough,
    span: uipassthrough,
    strong: uipassthrough,
    em: uipassthrough,
    button: function(ui) {
        return ["input", {type: "submit", name: "button", value: ui[1]}];
    },
    input: function(ui) {
        var attr = ui[1];
        var label = attr.label;
        var name = attr.name || label;
        var result = ["div"];
        if(label) {
            result.push(["div", ["label", {for: name}, label + ": "]]);
        }
        result.push(["input", {type: "text", inputmode: "latin predictOff", 
                name: name, id: name}]);
        return result;
    },
    entry: function(ui) {
        console.log(ui[1]);
        return ["div", ["a", {href: escapeFixed(ui[1].next) + "?id=" + escapeFixed(ui[1].id)}].concat(uiChildren(ui))];
    }
};

// translate a ui jsonml to html-jsonml
function ui2html(ui) {
    var transformer = ui_table[ui[0]];
    if(!transformer) {
        console.log("Unknown UI element: " + ui[0]);
        return ui;
    }
    return transformer(ui);
}

// # XHTML cgi user interface server
//
// TODO: extract node specific parts, such that this
// also runs on ringo etc.

// handle a request
function node_xhtml_ui(req, res, app) {
    var pagename, params;
    params = pagename = req.url.split('?')
    pagename = pagename[0].split('/');
    pagename = pagename[pagename.length - 1];
    if(params.length > 1) {
        params.shift();
        params = params.join('').split('&');
        params = _.reduce(params, function(acc, elem) {
            var t = elem.split("=");
            acc[unescapeFixed(t[0])] = unescapeFixed(t[1]);
            return acc;
        }, {});
    } else {
        params = {};
    }

    // TODO: extract static parts of this and put it outside of function.
    var env = {
        pagename: pagename,

        params: params,

        remoteCall: function(url, params, callback) {
            urlFetch("http://opensearch.addi.dk/1.0/?action=search&query=" + escapeFixed(params.query) + "&source=bibliotekdk&start=" + params.first + "&stepValue=" + params.count, function(data) { 
                    (JSON.stringify(jsonml.toObject(jsonml.fromXml(data)[0]), undefined, undefined));
                    (jsonml.toObject(jsonml.fromXml(data)[0]));
                });
            var entries = [];
            var total = 24;
            for(var i = 0; i < params.count; ++i ) {
                if(params.first+i < total) {
                    entries.push({author: "N.N", title: "book " + (params.first+ i)});
                }
            }
            callback({ total: total, entries: entries });
        },

        show: function(page) {
            var title = page.title || "untitled";
            var menu = page.menu || {};
            var next = page.next || ""
            var content = [];

            if(page.content) {
                content.push(["form", {action: next, method: "GET"}].concat(_.map(page.content, ui2html)));
            }

            if(page.callback) {
                var form = ["form", {action: this.pagename, method: "GET"}];
                _.each(params, function(value, key) {
                        if(key.slice(0,4) !== "MUI_") {
                            form.push(["input", {type: "hidden", name: key, value: value}]);
                        }
                });
                var pagename = this.pagename;
                this.pagename = page.callback;
                this.first = parseInt(this.params.MUI_CALLBACK_FIRST || "0", 10);
                if(this.params.MUI_BUTTON === "next") {
                    this.first += 10;
                }
                if(this.params.MUI_BUTTON === "previous") {
                    this.first -= 10;
                }
                form.push(["input", {type: "hidden", name: "MUI_CALLBACK_FIRST", value: "" + this.first}]);
                this.count = 10;
                this.entries = function(entries) {
                    var total = entries.total;
                    var first = (this.first + 1)
                    var last = (this.first+entries.content.length)

                    form.push(["div", "" + first, "-", "" + last, " / ",  "" + entries.total]);
                    _.each(entries.content, function(entry) {
                        form.push(ui2html(entry));
                    });
                    if(first >  1) {
                        form.push(["input", {type: "submit", name: "MUI_BUTTON", value:"previous"}]);
                    }
                    if(last < total) {
                        form.push(["input", {type: "submit", name: "MUI_BUTTON", value:"next"}]);
                    }
                };
                app.main(this);
                content.push(form);
            }

            var html = 
                ["html", { xmlns: "http://www.w3.org/1999/xhtml", "xml:lang": "en"}, 
                  ["head", 
                    ["title", title],
                    ["style", {type: "text/css"}, 'body { margin: 1% 2% 1% 2%; font-family: sans-serif; line-height: 130%; }']],
                  ["body", ["h1", title]].concat(content)];

            res.end(
                    ['<!DOCTYPE html PUBLIC "-//OMA//DTD XHTML Mobile 1.2//EN" "http://www.openmobilealliance.org/tech/DTD/xhtml-mobile12.dtd">',
                    jsonml.toXml(html)].join(""));
        }
    };
    app.main(env);
}

// Notes
/*
   infinite-list:


xhtml:

    x = env(req...pagename="search", ($X=)params)
    app.main(env{pagename="search"}):
        env.show({..., callback="search-callback"}):
            (same env with query passed to search-callback, but should be immutable for app.main)
            app.main(env{pagename="search-callback", first=0, count=10}):
                env.entries({first=0, count=10, total=16, content=[...]});
-> browser ->
    x = env(req...pagename="search", params=$X++{MOUI_CALLBACK_FIRST=10...}(pga. links));
    app.main(env{pagename="search"}):
        env.show({..., callback="search-callback"}):
            app.main(env{pagename="search-callback", first=10, count=10}):
                env.entries({first=10, count=6, total=16, content=[...]});


ajax:
    x = env(req...pagename="search")
    app.main(env{pagename="search"}):
        env.show({..., callback="search-callback"}):
            app.main(env{pagename="search-callback", first=0, count=10}):
                env.entries({first=0, count=10, total=16, content=[...]});
-> scroll fire env-event ->
            app.main(env{pagename="search-callback", first=10, count=10}):
                env.entries({first=10, count=6, total=16, content=[...]});
    


*/

// node-runner

http.createServer(function (req, res) {
    var params, t;
    res.writeHead(200, {'Content-Type': 'text/html'});;
    node_xhtml_ui(req, res, app);
}).listen(8080, "127.0.0.1");
