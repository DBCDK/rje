console = {};
console.log = function() {
    var args = Array.prototype.slice.call(arguments, 0);
    java.lang.System.out.println(args.join(" "));;
}

Packages.Foo.bar();
