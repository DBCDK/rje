import com.solsort.lightscript.*;

public class Main {
    public static void main(String args[]) {
        LightScript ls = new LightScript();
        try {
            Mui.register(ls);
            ls.eval(ls.getClass().getResourceAsStream("/main.js"));
        } catch (Throwable e) {
            e.printStackTrace();
        }
    }

    protected void pauseApp() {
    }

    protected void destroyApp(boolean unconditional) {
    }
}
