import com.solsort.lightscript.*;
import java.io.*;

public class Mui implements Function {
    static int dummy = 0;

    Object closure;
    int fn;
    public Object apply(Object[] args, int argpos, int argcount) throws LightScriptException {
        switch (fn) {
        case 0: { // console.log
            LightScript ls = (LightScript) closure;
            String s = "";
            for(int i = 1; i < argcount+1; ++i) {
                s+= (i>1?" ":"") + ls.toString(args[argpos+i]);
            }
            System.out.println(s);
            return ls.UNDEFINED;
        }
        case 1: { // load
            LightScript ls = (LightScript) closure;
            String name = "/js/" + args[argpos+1] + ".js";
            InputStream is = ls.getClass().getResourceAsStream(name);
            if(is==null) {
                throw new LightScriptException("Error, could not load " + name);
            }
            ls.eval(is);
            return ls.UNDEFINED;
        }
        case 2: { // typeof
            LightScript ls = (LightScript) closure;
            Object o = args[argpos+1];
            if(o == ls.UNDEFINED) {
                return "undefined";
            } else {
                return "[some type]";
            }
        }
        }
        return null;
    }

    private Mui(int fn, Object o) {
        this.fn = fn;
        this.closure = o;
    }

    private Mui(int fn) {
        this.fn = fn;
    }

    public static void register(LightScript ls) throws LightScriptException {
        ls.set("t", new Mui(0, ls));
        ls.eval("console={};console.log=t");
        ls.set("load", new Mui(1, ls));
        ls.set("typeof", new Mui(2, ls));
        ls.eval("load('xmodule')");
        ls.eval("LightScript=true");


/*
        Class menuClass = new MidpMenu().getClass();
        ls.set("Menu", new Mui(0));
        ls.setMethod(menuClass, "addItem", new Mui(1, ls));
        ls.setMethod(menuClass, "show", new Mui(2));
        ls.set("TextInput", new Mui(3, ls));

        MidpStorage storage = MidpStorage.openStorage(recordStoreName);
        ls.set("Storage", storage);
        Class storageClass = storage.getClass();
        ls.setMethod(storageClass, "get", new Mui(4, ls));
        ls.setMethod(storageClass, "set", new Mui(5, ls));
        */
    }
}
