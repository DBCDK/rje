// This is the infrastructure for running MUI server side,
// instead of client side. It runs within express webserver framework, and jsdom browser environment.
//
// It support any device capable of showin basic html without javascript)
// Essentially it works by rendering the user interface
// as a form, and then when the form is submitted, 
// use that as events in the server side execution of the business logic.
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
    
    // ## Find mui object
    // get the session id, either from cookie of post parameters
    var params = req.body || req.query;
    if(req.cookies && req.cookies._) {
        sid = req.cookies._;
    } else if(params._ && clients[params._]) {
        sid = params._;
    }

    // retrive or generate mui-object
    muiObject = clients[sid];
    if(!muiObject) {
        // generate an unique session id
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

    // ## Handle form values

    muiObject.formValue = function(name) { return params[name]; };
    // `_B` is the name-property of button elements in the form
    muiObject.button = params._B;

    // Lookup the event handler function.
    // When retrieving a value, we may need to unescape 
    // it if it is by GET request. Currently we are using POST
    // so this is disabled
    /*
    fn = muiObject.fns[unescapeUri(muiObject.button || "")] || mui.main;
    */
    fn = muiObject.fns[muiObject.button] || mui.main;
    muiObject.fns = {};
    
    // add an object to the browser environment, which can be used
    // for registring callbacks, and sending data back to the client.
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
        
    // Cleanup...
    delete params._;
    delete params._B;
    // ...and execute
    fn(muiObject);
}
