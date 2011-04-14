require("xmodule").def("Q",function(){
    // # Q is a module that contains various utility functions


    // ## Random  

    // shorthand for returning a random number 0 <= x < n
    var randint = exports.randint = function(n) {
        return 0 | (Math.random()*n)
    };

    // pick a random element from a list/string 
    // - used for creating random identifiers
    var pick = exports.pick = function(a) {
        return a[randint(a.length)];
    };

    // utility function for generating a random id uniq id
    // the id consist of a random string to make it unguessable
    // and a numeric sequence number to make it uniq
    //
    // Notice random may not be cryptographically strong
    // so the id is not 100% safe.
    //
    // The id is both plain uri'able and also usable as a 
    // JavaScript identifier
    var id = 0;
    exports.uniqId = function uniqId() {
        var letters = 'qwertyuiopasdfghjklzxcvbnmQWERTYIUOPASDFGHJKLZXCVBNM_';
        var result = pick(letters);
        for(var i = 0; i < 10; ++i) {
            result += pick(letters+"1234567890");
        }
        result += ++id;
        return result;
    }
    

    // ## Feature check
    var features = exports.features = {
        browser: typeof(navigator) !== "undefined",
        lightscript: typeof(LightScript) !== "undefined"
    };

    // feature check - server side javascript - only require ssjs, if on server
    var ssjs;
    if((!features.browser) && (!features.lightscript)) {
        features.ssjs = true;
        ssjs = require("ssjs");
    }

    // ## Function for (un-/)escaping URIS
    // The uri escape/unescape functions in JavaScript 
    // are, by the standard, not fully compatible
    // with the way escapes are done in the browser.
    // These functions works instead.
    // 
    // Notice that unescapeUri(escapeUri(x)) may also unescape
    // some &#NNN; as that is the way it is escaped.
    
    // Valid characters in URIs
    var urichars = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_~.";

    // An uri.
    var escapeUri = exports.escapeUri = function (uri) {
        var result = [];
        for(var i=0;i<uri.length;++i) {
            var c = uri[i];
            if(urichars.indexOf(c) >= 0) {
                result.push(c);
            } else {
                c = c.charCodeAt(0);
                if(c > 127) {
                    result.push(escapeUri("&#" + c + ";"));
                } else {
                    result.push( "%" + (c<16?"0":"") + c.toString(16));
                }
            }
        }
        return result.join("");
    };

    // unescape uri
    exports.unescapeUri = function(uri) {
        uri = uri.replace(RegExp("((\\+)|%([0-9a-fA-F][0-9a-fA-F]))", "g"), 
                          function(_1,_2,plus,hexcode) { 
                              if(plus) {
                                  return " ";
                              } else {
                                  return String.fromCharCode(parseInt(hexcode, 16));
                              }
                          })
        uri = uri.replace(RegExp("&#([0-9][0-9][0-9]*);", "g"), function(_, num) { 
            return String.fromCharCode(parseInt(num, 10)); 
        });
        return uri;
    }

    // when building an uri, this is a shorthand for making the
    // get-request string
    var encodeUrlParameters = exports.encodeUrlParameters = function (args) {
        var result = [];
        var name;
        for(name in args) {
            result.push(escapeUri(name) + "=" + escapeUri("" + args[name]));
        }
        return result.join("&");
    }


    // # Cross platform http requests

    // Function for executing code residing on a remote server
    // - this is used to be able to run browser cross-domain etc.
    var executeRemote = exports.executeRemote = function(url) {
        if(features.ssjs) {
            ssjs.urlFetch(url, function(txt) {
                Function(txt)();
            });
        } else if(features.browser) {
            var scriptTag = document.createElement("script");
            scriptTag.setAttribute("src", url);
            document.getElementsByTagName("head")[0].appendChild(scriptTag);
        } else if(features.lightscript) {
            httpget(url, function(data) {
                eval(data);
            });
        } else {
            throw "unsupported operation"
        }
    };

    // 
    exports.callJsonpWebservice = function(url, callbackParameterName, args, callback) {
        // clone args, as we want to add a jsonp-callback-name-property
        // without altering the original parameter
        args = Object.create(args); 


        // temporary global callback function, that deletes itself after used
        var callbackName = "_Q_" + uniqId();
        var callbackFn = global[callbackName] = function(data) {
            if(global[callbackName]) {
                global[callbackName] = undefined;
                try {
                    callback(data);
                } catch(e) {
                    callbackError(e);
                }
            }
        }
        // if we haven't got an answer after one minute, assume that an error has occured, 
        // and call the callback, without any arguments.
        setTimeout(callbackFn, 60000);

        args[callbackParameterName] = callbackName;

        executeRemote(url + "?" + encodeUrlParameters(args));
    }


    exports.heap = function(cmp) {
        return {
            push: function(arr,elem) {
                var pos = arr.length;
                arr.push(elem);
                while(pos > 0) {
                    var parentid = 0| ((pos+1)/ 2) - 1;
                    var parent = arr[parentid];
                    if(cmp(elem, parent) < 0) {
                        arr[pos] = parent;
                        pos = parentid;
                    } else {
                        arr[pos] = elem;
                        pos = 0;
                    }
                }
            },
            pop: function(arr) {
                var result = arr[0];
                var elem = arr.pop();
                if(arr.length === 0) return result;
                arr[0] = elem;
                var pos = 0;
                for(;;) {
                    var posnext = 2*pos + 1;
                    if(posnext >= arr.length) { 
                        arr[pos] = elem; 
                        return result;
                    }
                    var next = arr[posnext];
                    if(posnext+1 < arr.length && cmp(next, arr[posnext+1]) > 0) {
                        ++posnext;
                        next = arr[posnext];
                    }
                    if(cmp(elem, next) < 0) {
                        arr[pos] = elem;
                        return result;
                    }
                    arr[pos] = next;
                    pos = posnext;
                };
            }
        }
    }

});
