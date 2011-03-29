require("xmodule").def("mui",function(){

if(typeof process !== "undefined" && process.versions && process.versions.node) {
    exports.setMain = require("muiWap").setMain;
} else if(true /* html5 backend */) {
    exports.setMain = require("muiApp").setMain;
} else {
    // ...
}

});
