require("xmodu").xmodu("test1", function() {
    console.log("test1 a");
    exports.t = "test1.t";
    exports.t2= require("test2");
    console.log("test1 b");
});
