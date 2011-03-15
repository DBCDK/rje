define(function(require, exports, module) {

jsonml = require("jsonml");

// # Mobile user interface - html5 version
exports.showPage = function(page) {
    if(page[0] !== "page") {
        throw("Parameter to showPage must be a jsonml 'page'");
    } 
    showHTML(pageTransform(page));
};

var dispatch = function() { throw "Dispatch function not defined. Remember to call mui.setDispatch. Before showing ui-elements that may call back"; };

exports.setDispatch = function(dispatchFunction) {
    dispatch = dispatchFunction;
}

function pageTransform(page) {

    var handlers = {
        inputarea: function(html, node) {
        },
        choice: function(html, node) {
        },
        text: function(html, node) {
            var result = ["div", {"class": "contentbox"}];
            jsonml.childReduce(node, nodeHandler, result);
            html.push(result);
        },
        button: function(html, node) {
            if(!jsonml.getAttr(node, "id")) {
                throw "buttons must have an id attribute";
            }
            var attr = {"type": "submit", "value": "sometext", "class": "button", onclick: "window.__mui_dispatch__('" + jsonml.getAttr(node, "id") + "');"};
            var result = ["span", attr, "foobar"];
            html.push(result);
        }
    }

    function nodeHandler(html, node) {
        if(typeof(node) === "string") {
            html.push(node);
        } else {
            var handle = handlers[node[0]]; 
            if(!handle) {
                throw "mui received a page containing an unknown tagtype: " + node[0];
            }
            handle(html, node);
            return html;
        }
    }

    var html = [];
    var title = jsonml.getAttr(page, "title") || "untitled";
    html.push(["div", {"class":"header"}, title]);
    jsonml.childReduce(page, nodeHandler, html);
    html.push(["div", {"class":"contentend"}, " "]);
    return html;
}

function height(dom) {
    return document.defaultView.getComputedStyle(dom, "").getPropertyValue("height");
}

function gId(name) {
    return document.getElementById(name);
}

function domRemove(node) {
    node.parentNode.removeChild(prev);
}

function showHTML(html) {
    next = document.createElement("div");
    next.setAttribute("id", "next");
    next.setAttribute("onClick", "handleClick()");
    next.innerHTML = html.map(jsonml.toXml).join('');
    var current = gId("current");
    gId("container").insertBefore(next, current);
    current.style.top = "-" + height(next);
    setTimeout(slidein, 0);
}

function slidein() {
    window.scroll(0,0);

    domRemove(gId("prev"));

    gId("current").setAttribute("id", "prev");

    var next = gId("next");
    next.setAttribute("id", "current");

    gId("container").style.height = Math.max(parseInt(height(next), 10), window.innerHeight) + "px";
}
});
