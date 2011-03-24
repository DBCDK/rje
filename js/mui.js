require("xmodule").def("mui",function(){


if(true /* html5 backend */) {
    exports.setMain = require("muiApp").setMain;
} else {
    // ...
}

});
