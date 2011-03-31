import javax.microedition.midlet.MIDlet;
import com.solsort.lightscript.*;
import com.solsort.mobile.*;

public class Midlet extends MIDlet {
    protected void startApp() {
        LightScript ls = new LightScript();
        System.out.println("Starting");
        try {
            Mui.register(ls, this);
            ls.eval(this.getClass().getResourceAsStream("script.ls"));
        } catch (Throwable e) {
            e.printStackTrace();
        }
    }

    protected void pauseApp() {
    }

    protected void destroyApp(boolean unconditional) {
    }
}
