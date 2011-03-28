require("xmodule").def("Q",function(){

var randint = exports.randint = function(a, b) {
    if(b===undefined) {
        b = a; a = 0;
    }
    return a + 0|(Math.random()*(b-a));
}

exports.pick = function(a) {
    return a[randint(a.length)];
}

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

exports.escapeUri = function(uri) {
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

});
