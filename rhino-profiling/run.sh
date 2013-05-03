export JSJAR=`locate js.jar | head -n 1`
javac -cp $JSJAR dk/dbc/rhinoprofiler/*.java && jar cf rhinoprofiler.jar dk/dbc/rhinoprofiler/*.class && java -classpath ./rhinoprofiler.jar:$JSJAR org.mozilla.javascript.tools.shell.Main -opt -1 run.js 
