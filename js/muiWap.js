require("xmodule").def("muiWap",function(){

    var http = require('http');
    var jsonml = require('jsonml');
    var _ = require('underscore')._;
    var Q = require('Q');

    var mainFn = function(mui) {
	mui.showPage(["page", {title: "error"}, ["text", "mui.setMain(...) has not been called"]]);
    }

    function randId() {
	var result = "";
	var cs = "1234567890_-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	for(var i=20; i; --i) {
            result += Q.pick(cs);
	}
	return result;
    }

    exports.setMain = function(fn) {
	mainFn = fn;
    }

    var mui = {
	form: {},
	loading: function() {
	},
	callJsonpWebservice: function(url, callbackParameterName, args, callback) {
            throw "not implemented yet...";
	},
	showPage: function(page) {
            var title = jsonml.getAttr(page, "title");
            var html =  ["html", { xmlns: "http://www.w3.org/1999/xhtml", "xml:lang": "en"}, 
			 ["head", ["title", title], ["style", {type: "text/css"}, 
						     'body { margin: 1% 2% 1% 2%; font-family: sans-serif; line-height: 130%; }']],
			 ["body"].concat(pageTransform(page, this))];
            this.httpResult.writeHead(200, {'Content-Type': 'text/html'});;
            this.httpResult.end(
		['<!DOCTYPE html PUBLIC "-//OMA//DTD XHTML Mobile 1.2//EN" "http://www.openmobilealliance.org/tech/DTD/xhtml-mobile12.dtd">',
		 jsonml.toXml(html)].join(""));
	}
    }

    clients = {};


    function pageTransform(page, mui) {
        var i = 0;
        function uniqId() {
            return "id" + i++;
        }
        var handlers = {
            section: function(html, node) {
                var result = ["div", {"class": "section"}];
                jsonml.childReduce(node, nodeHandler, result);
                html.push(result);
            },
            input: function(html, node) {
                var result = ["div", {"class": "input"}];
                var type = jsonml.getAttr(node, "type");
                if(!type) {
                    throw "input widgets must have a type attribute";
                }
                var name = jsonml.getAttr(node, "name");
                if(!name) {
                    throw "input widgets must have a name attribute";
                }

                var labelid = uniqId();
                if(jsonml.getAttr(node, "label")) {
                    result.push(["div", {"class": "label"}, ["label", {"for": labelid}, jsonml.getAttr(node, "label"), ":"]]);
                }

                var tagAttr = {"class": type, "id": labelid, "name": name};
                if(type === "textbox") {
                    result.push(["textarea", tagAttr, ""]);                
                } else if(type === "email" || type === "text") {
                    tagAttr.type = "text";
                    tagAttr.inputmode = "latin";
                    result.push(["input", tagAttr]);
                } else if(type === "tel") {
                    tagAttr.style = "-wap-input-format:'*N'";
                    tagAttr.type = "text";
                    tagAttr.inputmode = "digits";
                    result.push(["input", tagAttr]);
                } else {
                    throw "unknown input type: " + type;
                }
                html.push(result);
            },
            choice: function(html, node) {
                var result = ["div", {"class": "input"}];
		
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
                var result = ["div", {"class": "text"}];
                jsonml.childReduce(node, nodeHandler, result);
                html.push(result);
            },
            button: function(html, node) {
                if(!jsonml.getAttr(node, "fn")) {
                    throw "buttons must have an fn attribute, containing a function to call";
                }

                var text = node.slice(2).join("");
                mui.fns[text] = jsonml.getAttr(node, "fn");

                var attr = {"class": "button", type: "submit", "name": "_B", value: text};
                var result = ["input", attr];
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
	
        var html = ["form", ["input", {type: "hidden", name: "_", value: mui.__session_id__}]];
        var title = jsonml.getAttr(page, "title") || "untitled";
        jsonml.childReduce(page, nodeHandler, html);
        return [["h1", title], html];
    }

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
	var client = require('http').createClient(80, host);
	var request = client.request('GET', path, {'host': host});
	request.end();

	request.on('response', function (response) {
            response.on('data', function(chunk) { result.push(chunk); });
            response.on('end', function() { callback(result.join("")) });
	});
    }

    http.createServer(function (req, res) {
	var muiObject, sid, fn;
	var params = req.url.split('?')
	if(params.length > 1) {
            params.shift();
            params = params.join('').split('&');
            params = _.reduce(params, function(acc, elem) {
		var t = elem.split("=");
		acc[Q.unescapeUri(t[0])] = Q.unescapeUri(t[1]);
		return acc;
            }, {});
	} else {
            params = {};
	}

	if(params._ && clients[params._]) {
            muiObject = clients[params._];
            sid = params._;
	} else {
            muiObject = Object.create(mui);
            sid = muiObject.__session_id__ = randId();
            muiObject.session = {};
            muiObject.fns = {};
            // mem leak, sessions are never deleted
            clients[sid] = muiObject;
	}
	muiObject.httpResult = res;
	muiObject.httpRequest = req;
	muiObject.button = params._B;
	muiObject.form = params;

	fn = muiObject.fns[Q.unescapeUri(params._B || "")] || mainFn;
	muiObject.fns = {};
	
	delete params._;
	delete params._B;
	fn(muiObject);
    }).listen(8080, "127.0.0.1");
    console.log("Listening on 127.0.0.1:8080");
});
