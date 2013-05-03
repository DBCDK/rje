package dk.dbc.rhinoprofiler;
import org.mozilla.javascript.debug.*;
import org.mozilla.javascript.*;
import java.util.*;

public class ProfilerDebugger implements Debugger {
    public Map<String, Long> timings;
    String prevPos;
    long prevtime;
    public class ProfilerFrame implements DebugFrame {
        String sourceName;
        public ProfilerFrame(DebuggableScript fnOrScript) {
            this.sourceName = fnOrScript.getSourceName();
        };
        public void onDebuggerStatement(Context cx) {
        };
        public void onEnter(Context cx, Scriptable activation, Scriptable thisObj, Object[] args) {
        };
        public void onExceptionThrown(Context cx, Throwable ex) {
        };
        public void onExit(Context cx, boolean byThrow, Object resultOrException) {
        };
        public void onLineChange(Context cx, int lineNumber) {
            String s = sourceName + ":" + lineNumber;
            long t = System.nanoTime();
            Long prevt = timings.get(prevPos);
            if(prevt == null) {
                prevt = new Long(0);
            }
            timings.put(prevPos, t - prevtime + prevt.longValue());
            prevPos = s;
            prevtime = t;
        };
    };
    public ProfilerDebugger() {
            timings = new HashMap<String, Long>();
            prevtime = System.nanoTime();
            prevPos = "codestart";
    };
    public DebugFrame getFrame(Context cx, DebuggableScript fnOrScript) {
        return new ProfilerFrame(fnOrScript);
    };
    public void handleCompilationDone(Context cx, DebuggableScript fnOrScript, String source) {
    };
}
