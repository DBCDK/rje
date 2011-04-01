import com.solsort.lightscript.*;
import java.io.*;
import java.util.*;
import javax.microedition.lcdui.*;
import javax.microedition.midlet.*;

public class Mui implements Function, CommandListener {
    static int dummy = 0;

    int fn;
    static Form form;
    static LightScript ls;
    static Midlet mid;
    static Hashtable commands;
    public void commandAction(Command c, Displayable d) {
        try {
            ls.call((Function) commands.get(c));
        } catch(LightScriptException e) {
            e.printStackTrace();
        }
    }
    public Object apply(Object[] args, int argpos, int argcount) throws LightScriptException {
        switch (fn) {
        case 0: { // console.log
            String s = "";
            for(int i = 1; i < argcount+1; ++i) {
                s+= (i>1?" ":"") + ls.toString(args[argpos+i]);
            }
            System.out.println(s);
            return ls.UNDEFINED;
        }
        case 1: { // load
            String name = "/js/" + args[argpos+1] + ".js";
            InputStream is = ls.getClass().getResourceAsStream(name);
            if(is==null) {
                throw new LightScriptException("Error, could not load " + name);
            }
            ls.eval(is);
            return ls.UNDEFINED;
        }
        case 2: { // typeof
            Object o = args[argpos+1];
            if(o == ls.UNDEFINED) {
                return "undefined";
            } else if(o instanceof String) {
                return "string";
            } else if(o instanceof Integer) {
                return "number";
            } else {
                return "object";
            }
        }
        case 3: { // newform(title)
            form = new Form(ls.toString(args[argpos+1]));
            commands = new Hashtable();
            Display.getDisplay(mid).setCurrent(form);
            form.setCommandListener(this);
            return ls.UNDEFINED;
        }
        case 4: { // textfield(label, length, type) -> textbox
            TextField t = new TextField(ls.toString(args[argpos+1]), "",
                            ls.toInt(args[argpos+2]), ls.toInt(args[argpos+3]));
            form.append(t);
            return t;
        }
        case 5: { // textvalue(textbox) -> txt
            return ((TextField)args[argpos+1]).getString();
        }
        case 6: { // choice(label) -> choice
            ChoiceGroup choice = new ChoiceGroup(ls.toString(args[argpos+1]), Choice.EXCLUSIVE);
            form.append(choice);
            return choice;
        }
        case 15: { // addchoice(choice, text)
            ((ChoiceGroup)args[argpos+1]).append(ls.toString(args[argpos+2]), null);
            return ls.UNDEFINED;
        }
        case 7: { // choiceno(choiceset) -> int
            return new Integer(((ChoiceGroup)args[argpos+1]).getSelectedIndex());
        }
        case 8: { // addbutton(text, callback)
            Command c = new Command(ls.toString(args[argpos+1]), 1, 0);
            commands.put(c, (Function)args[argpos+2]);
            form.addCommand(c);
            return ls.UNDEFINED;
        }
        case 9: { // httpeval(url, callback)
            return ls.UNDEFINED;
        }
        case 10: { // stringitem(text)
            form.append(ls.toString(args[argpos+1]));
            return ls.UNDEFINED;
        }
        case 11: { // localStoreGet(key)
            return ls.UNDEFINED;
        }
        case 12: { // localStoreSet(key, value)
            return ls.UNDEFINED;
        }
        case 13: { // localStoreRemove(key)
            return ls.UNDEFINED;
        }
        case 14: { // setTicker(text)
            form.setTicker(new Ticker(ls.toString(args[argpos+1])));
            return ls.UNDEFINED;
        }
        }
        return null;
    }

    private Mui(int fn) {
        this.fn = fn;
    }

    public static void register(LightScript lightscript, Midlet midlet) throws LightScriptException {
        ls = lightscript;
        mid = midlet;
        ls.set("t", new Mui(0));
        ls.eval("console={};console.log=t");
        ls.set("load", new Mui(1));
        ls.set("typeof", new Mui(2));
        ls.eval("load('xmodule')");
        ls.eval("LightScript=true");
        ls.set("newform", new Mui(3)); // newform(title)
        ls.set("textfield", new Mui(4)); // textfield(label, length, type) -> textbox
        ls.set("textvalue", new Mui(5)); // textvalue(textbox) -> txt
        ls.set("choice", new Mui(6)); // choice(label, [choices...]) -> choiceset
        ls.set("choiceno", new Mui(7)); // choiceno(choiceset) -> int
        ls.set("addbutton", new Mui(8)); // addbutton(text, callback)
        ls.set("httpeval", new Mui(9)); // httpeval(url, callback)
        ls.set("stringitem", new Mui(10)); // stringitem(text)
        ls.set("localStoreGet", new Mui(11)); // localStoreGet(key)
        ls.set("localStoreSet", new Mui(12)); // localStoreSet(key, value)
        ls.set("localStoreRemove", new Mui(13)); // localStoreRemove(key)
        ls.set("setTicker", new Mui(14)); // setTicker(text)
        ls.set("addchoice", new Mui(15)); // setTicker(text)


/*
    
        Form form = new Form("title");
        Display.getDisplay(this).setCurrent(form);

        form.append(new StringItem("", "text..."));
        form.append(new TextField("textinput", "", 200, TextField.ANY));
        form.append(new TextField("tel", "", 20, TextField.PHONENUMBER));
        form.append(new TextField("email", "", 40, TextField.EMAILADDR));
        ChoiceGroup choice = new ChoiceGroup("choice-label", ChoiceGroup.EXCLUSIVE);
        choice.append("Option1", null);
        choice.append("Option2", null);
        choice.append("Option3", null);
        form.append(choice);
        form.addCommand(new Command("button1", 1, 0));
        form.addCommand(new Command("button2", 1, 0));
        form.setTicker(new Ticker("Loading..."));


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
