javac -source 1.2 -classpath .:external_dependencies/midpapi10.jar:external_dependencies/cldcapi10.jar Midlet.java com/solsort/lightscript/*.java &&
jar -cvfm examples/in.jar manifest com/solsort/*/*.class *.class main.js js/*.js &&
java -jar external_dependencies/proguard.jar @examples/midlets.pro &&
mv examples/out.jar mui.jar &&
java -jar external_dependencies/microemulator.jar examples/in.jar
