load("xmodule");

console.log({a: 123, b:12});
require("xmodule").def('testing', function() {
    console.log("testing");
    console.log(require("test").test);
});
