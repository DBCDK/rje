require('jsdom').jsdom.env(
'<div id="container"><div id="current"></div><div class="contentend"></div></div><div id="loading">Loading...</div>',[
  'mui/jquery16min.js',
  "mui/jsonml.js",
  "mui/mui.js",
  "main.js"
], function(errors, window) {
  window.ssjs = true;
  console.log(Object.keys(window));
  console.log(errors);
  start = (new Date()).getTime();
  window.mui.showPage(["page", "Hello world"]);
  console.log("time:", (new Date()).getTime() - start);
  console.log(window.$('body').html());

for(var i=0;i<2000;++i) {
  start = (new Date()).getTime();
  window.mui.showPage(["page", {title: "Sp\xf8rg biblioteket"},
      ["section",
        ["input", {type: "textbox", name: "question", label: "Mit sp\xf8rgsm\xe5l"}],
        ["choice", {name: "deadline", label: "V\xe6lg tidsfrist..."},
          ["option", {value: "-1"}, "ingen"],
          ["option", {value: "2"}, "2 timer"],
          ["option", {value: "24"}, "24 timer"],
          ["option", {value: "48"}, "2 dage"],
          ["option", {value: i}, "1 uge"] ],
        ["choice", {name: "use", label: "Svaret skal bruges til..."},
          ["option", {value: "personal"}, "Almen interesse"],
          ["option", {value: "business"}, "Erhverv"],
          ["option", {value: "school1"}, "Folkeskole"],
          ["option", {value: "school2"}, "Gymnasium"],
          ["option", {value: "school3"}, "Videreg\xe5ende uddannelse"],
          ["option", {value: "school4"}, "Universitet/Forskning"] ]],
        ["button", {fn: function() { }}, "Sp\xf8rg"],
        ["button", {fn: function() { }}, "Indstillinger"] ]);
  console.log("time:", (new Date()).getTime() - start);
  }
  console.log(window.$('body').html());

  setTimeout( function() {console.log(window.$('body').html());}, 1000);
  /*
  $ = window.$;
  document  = window.document;
  console.log("contents of a.the-link:", window.$("a.the-link").text());
  console.log(window.mui);
  */
});
