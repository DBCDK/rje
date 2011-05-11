require("xmodule").def("ssjs",function(){
     if(typeof(process) === "undefined" || process.versions.node === undefined) {
        throw "could not load ssjs, - not on node!";
     }


    exports.urlFetch = function(url, callback) {
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

    var app;
    exports.webserve = function(path, fn) {
        var express = require("express");
        if(!app) {
            app = express.createServer();
            app.configure(function(){
                //app.use(express.methodOverride());
                app.use(express.bodyParser());
                app.use(express.cookieParser());
                //app.use(app.router);
            });

            try {
                app.listen(80);
            } catch(e) {
                app.listen(8080);
            }
        }
        app.all(path, function(req, res) {
            fn(req, res);
        });
    }


});
