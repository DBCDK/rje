(function() {

    if(typeof require === "undefined") {
        var global = this;

        if(typeof(console) === "undefined") {
            alert("Console not available");
            console = {};
            console.log = function() {};
        }

        global.require = function(name) {
            if(modules[name]) {
                return modules[name];
            } 
            if(failedModules[name]) {
                throw "Loading failed: " + name;
            }
            throw {missingModule: name};
        }
        require.paths = [defaultPath];

        // function to make certain requires behav
        var failedModules = {};
        var workaround = {
            phonegap: {
                url: "external/phonegap.0.9.4",
                fn: function() {
                    exports = PhoneGap;
                },
            },
            "es5-shim": {
                url: "external/es5-shim",
                fn: function() { }
            },
            json2: {
                url: "external/json2",
                fn: function() { }
            },
            underscore: {
                url: "external/underscore",
                fn: function() {
                    exports = _;
                    _._ = _;
                }
            }
        };
        var moduleFn = {};
        var loadStack = [];
        var defaultPath = "mui/"
        var fetchReqs = {};

        // Asynchronous fetch 
        function fetch(name) {
            if(fetchReqs[name]) {
                return;
            }
            fetchReqs[name] = true;

            var scriptTag = document.createElement("script");

            if(require.paths.length !== 1) {
                var err = "require.paths with length other than one is not supported";
                alert(err);
                throw(err);
            }

            // TODO: handling of path
            var url = name;
            if(workaround[name] && workaround[name].url) {
                url = workaround[name].url;
            }
            url = require.paths[0] + url + ".js";

            scriptTag.src = url + "?" + Math.random();

            // Currently no IE 6/7 support - could be implemented
            // with addional onreadystatechange...
            function callback() {
                if(workaround[name]) {
                    moduleFn[name] = moduleFn[name] || workaround[name].fn;;
                }

                load(name);
            }

            /* seems to be standard */
            scriptTag.onload = callback;
            /* IE-6/7 */
            scriptTag.onreadystatechange = function() { this.readyState === 'complete' && callback(); };
            //document.head.appendChild(scriptTag);
            document.getElementsByTagName("head")[0].appendChild(scriptTag);
        }

        function load(name) {
            // already loaded
            if(modules[name]) {
                return;
            }

            // ensure sane environment
            if(typeof Object.create !== "function") {
                fetch("es5-shim");
                setTimeout(function() { load(name); }, 20);
            }
            if(typeof JSON === "undefined") {
                fetch("json2");
                setTimeout(function() { load(name); }, 20);
            }

            // load module
            if(moduleFn[name]) {
                /* TODO: assert exports is undefined */
                global.exports = {};

                try {
                    moduleFn[name]();

                } catch(e) {
                    delete global.exports;

                    if(e.missingModule) {
                        fetch(e.missingModule);
                        loadStack.push(name);
                        return;
                    }

                    throw e;
                }

                modules[name] = global.exports;
                delete global.exports;

                var loading = loadStack;
                loadStack = [];
                while(loading.length > 0) {
                    load(loading.pop());
                }
                return;
            }
            failedModules[name] = true; 
        }

        var def = function(name, fn) {
            moduleFn[name] = fn;
            load(name);
        }

        var modules = { xmodule: { def: def } };

    } else {
        exports.def = function(name, fn) {
            fn();
        };
        exports.setPath = function() { };
    }
})();

