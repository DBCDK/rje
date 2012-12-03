console = {};
console.log = function() {
    var args = Array.prototype.slice.call(arguments, 0);
    java.lang.System.out.println(args.join(" "));;
}
context = org.mozilla.javascript.Context.getCurrentContext();
f = function() {
};
count = 0;
ctx3 = org.mozilla.javascript.Context.enter();
console.log(context, ctx3);
thread = new java.lang.Thread(function() {
    ctx2 = org.mozilla.javascript.Context.enter();
    console.log(context, ctx2);
    debugFrame = {
    onDebuggerStatement: function(context) {
    },
    onEnter: function(context, activation, thisobj, args) {
        ++count;
    },
    onExceptionThrown: function(context, throwable) {
    },
    onExit: function(context, byThrow, resultOrException) {
    },
    onLineChange: function(context, lineno) {
    }
    };
    frame = new org.mozilla.javascript.debug.DebugFrame(debugFrame);
    debug = {
    getFrame: function(context, fnOrScript) {
        return frame;
    },
    handleCompilationDone: function(context, fnOrScript, source) {
    }
    };
    //context.setDebugger(new org.mozilla.javascript.debug.Debugger(debug), undefined);
});
thread.start();
java.lang.Thread.currentThread().sleep(100);
for(i=0;i<1000;++i) {
    f();
}
console.log(count);
