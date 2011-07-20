// This is the infrastructure for running MUI server side,
// instead of client side. It runs within express webserver framework, and jsdom browser environment.
/**/
// # Setup express/jsdom 
var express = require('express');

var app = express.createServer();

app.configure(function(){
    /*app.use(express.methodOverride());*/
    // Support for reading parameters.
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    // Need to serve `/mui` static in order to have style sheets.
    app.use("/mui", express.static(__dirname + '/mui'));
    /*app.use(app.router);*/
});


// Create a server-side browser environment for doing the transformation from
// jsonml to html.
//
// We only have one browser-environment for all clients 
// making the dom-initialisation once, instead of having
// an initialisation cost per connection.
// The browser environment is used for the page transformation,
// which is safe for multiple clients, as we have cooperative multitasking, 
// the page transformation doesn't yield, and it cleans up after itself.
// Notice that the transformation is cpu/memory-bound, so preemptive 
// multitasking would only reduce performance. For scaleability: run
// several processes/servers with a load balancer on top.
require('jsdom').jsdom.env('<div id="container"><div id="current"></div></div>',
        [ 'mui/jquery16min.js', "mui/jsonml.js", "mui/mui.js", 
            "../../sporgetjeneste/code/main.js" ], function(errors, window) {

    // Hide the mui object, - not really needed
    // but defensive programming, such that the 
    // business logic code, doesn't find it by a mistake,
    // instead of the mui object it is passed.
    var mui = window.mui;
    window.mui = undefined;

    
    app.all('/', function(req, res){
        handleRequest(req, res, window, mui);
    });

    // Listen on port 80 if we are running as a daemon,
    // or 8080 if we are running user-space without
    // access to <1024 ports.
    try {
        app.listen(80);
    } catch(e) {
        app.listen(8080);
    }
});

// # The request handler
/**/
// Session data for the connected clients.
// TODO: serialise and limit number of sessions to fix leak.
clients = {};

function handleRequest(req, res, window, mui) {
    var muiObject, sid, fn;
    
    // get the session id, either from cookie of post parameters
    var params = req.body || req.query;
    if(req.cookies && req.cookies._) {
        sid = req.cookies._;
    } else if(params._ && clients[params._]) {
        sid = params._;
    }

    muiObject = clients[sid];

    if(!muiObject) {
        sid = (new Date).getTime() % 10000 + Math.random();
        res.cookie('_', sid, {maxAge: 5*365*24*60*60*1000});

        muiObject = Object.create(mui);
        muiObject.sid = sid;
        muiObject.session = {};
        muiObject.fns = {};

        // TODO: fix mem leak, sessions are never deleted
        clients[sid] = muiObject;

        // TODO: actually back store to disk or database
        muiObject.storage = (function() {
            var store = {};
            return {
                getItem: function(key) { return store[key]; },
                setItem: function(key, value) { store[key] = value; }
            };
        })();
    }

    muiObject.formValue = function(name) { return params[name]; };

    muiObject.button = params._B;

    /*
    fn = muiObject.fns[unescapeUri(muiObject.button || "")] || mui.main;
    */
    fn = muiObject.fns[muiObject.button] || mui.main;
    muiObject.fns = {};
    
    window.ssjs = {
        buttonName: function(name, fn) {
            muiObject.fns[name] = fn;
        },
        send: function() {
            res.header("Content-Type", "text/html;charset=UTF-8");
            res.end('<!doctype html><html>'
                + '<head>'
                + '<title>' + window.$("h1").text() + '</title>'
                + '<link rel="stylesheet" href="mui/mui.css">'
                + '<meta http-equiv="Content-Type"'
                + ' content="text/html;charset=UTF-8">'
                + '<meta name="MobileOptimized" content="320"/>'
                + '<meta name="HandheldFriendly" content="True">'
                + '<meta name="viewport" content="width=320,initial-scale=1.0">'
                /*
                + '<link rel="shortcut icon" href="icon.png">'
                + '<link rel="apple-touch-startup-image" href="splash.png">'
                + '<meta name="apple-mobile-web-app-capable" content="yes">'
                + '<link rel="apple-touch-icon-precomposed" href="icon.png">'
                + '<meta http-equiv="X-UA-Compatible"' 
                + ' content="IE=edge,chrome=1">'
                + '<meta name="apple-mobile-web-app-status-bar-style"' 
                + ' content="black">'
                */
                + '</head><body><form method="POST" action="/">'
                + window.$("body").html()
                + '</form></body></html>'
            );
        }
    }
        
    delete params._;
    delete params._B;
    fn(muiObject);

}
