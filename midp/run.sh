cd src
javac -source 1.2 -classpath .:../externals/midpapi10.jar:../externals/cldcapi10.jar `find . -name "*.java"`  &&
jar -cvfm mui-debug.jar manifest `find . -name "*.class"` main.js js/*.js &&
java -jar ../externals/proguard.jar @mui.pro &&
java -jar ../externals/microemulator.jar mui-debug.jar
