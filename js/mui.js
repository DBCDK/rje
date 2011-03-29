// # Mui main module
// Mobile user interface
require("xmodule").def("mui", function() {

Q = require("Q");

// This is just a dispatch
// which loads the correct module
// depending on if we are in a browser
// or server side javascript
if(Q.features.nodejs) {
    exports.setMain = require("muiWap").setMain;
} else if(Q.features.browser) {
    exports.setMain = require("muiApp").setMain;
} else {
    throw "unsupported environment";
}

});
