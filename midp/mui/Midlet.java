import javax.microedition.midlet.MIDlet;
import javax.microedition.lcdui.*;
import com.solsort.lightscript.*;
import com.solsort.mobile.*;

public class Midlet extends MIDlet {
    protected void startApp() {
        LightScript ls = new LightScript();
        System.out.println("Starting");
        try {
            Mui.register(ls);
            ls.eval(this.getClass().getResourceAsStream("main.js"));
        } catch (Throwable e) {
            e.printStackTrace();
        }
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
    }

    protected void pauseApp() {
    }

    protected void destroyApp(boolean unconditional) {
    }
}
