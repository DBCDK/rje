require("xmodule").def("Q",function(){
    var features = exports.features = {
	browser: typeof navigator !== "undefined",
	nodejs: typeof process !== "undefined" && process.versions.node !== undefined
    };

    var executeRemote = exports.executeRemote = function(url) {
	if(features.nodejs) {
	    throw "TODO";
	} else if(features.browser) {
	    var scriptTag = document.createElement("script");
	    scriptTag.setAttribute("src", url);
	    document.getElementsByTagName("head")[0].appendChild(scriptTag);
	} else {
	    throw "unsupported operation"
	}
    };

    var randint = exports.randint = function(n) {
	return 0 | (Math.random()*n)
    };

    exports.pick = function(a) {
	return a[randint(a.length)];
    };

    // Fixed uri escape. JavaScripts escape, encodeURI, ... are buggy.
    // These should work.
    exports.unescapeUri = function(uri) {
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

    exports.escapeUri = function escapeUri(uri) {
	uri = uri.replace(/[^a-zA-Z0-9-_~.]/g, function(c) {
            c = c.charCodeAt(0);
            if(c > 255) {
		return escapeUri("&#" + c + ";");
            } else {
		return "%" + (c<16?"0":"") + c.toString(16);
            }
	});
	return uri;
    };

});
