console = {};
console.log = function() {
    var args = Array.prototype.slice.call(arguments, 0);
    java.lang.System.out.println(args.join(" "));;
}
context = org.mozilla.javascript.Context.getCurrentContext();
context.setOptimizationLevel(-1);
profiler = new Packages.dk.dbc.rhinoprofiler.ProfilerDebugger();
context.setDebugger(profiler, undefined);
fib = function(n) {
    if(n<2) { 
        return 1;
    } else {
        return fib(n-1) + fib(n-2);
    }
}
loop = function(n) {
    var i;
    for(i=0;i<n;++i) {
        ++i;
    }
    ++i;
};
bench = function() {
    fib(20);
    loop(100000);
}
bench();
timings = profiler.timings;
times = [];
timings.keySet().toArray().forEach(function(x) {
    times.push({line: x, time: Number(timings.get(x))});
});
times = times.sort(function(a, b) { return a.time - b.time; }).map(function(entry) {
    return entry.line + " " + entry.time;
})
console.log(times.join("\n"));
