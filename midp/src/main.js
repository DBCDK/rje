console.log([1,2,3,4].join("?"));
/*
o = {a:2, b:3};
o2 = Object.create(o);
o2.c = 4;
for(x in o2) {
    console.log("o2", x);
}
setTimeout(function() {
    console.log("timeout");
}, 100);
console.log("HERE");
x = 1/10;
console.log("1/3", 1/3);
console.log("x = 1/10", x);
console.log("x-x*x", x-x*x);
console.log("Math.random()", Math.random());
console.log("Math.random()", Math.random());
console.log("Math.random()", Math.random());
console.log("Math.random()", Math.random());
a = {};
console.log("HERE!!!");
console.log(a.a=1);

console.log(255);
console.log((255).toString(16));

foo = function(x) {
    console.log("foo", x);
};
httpget("http://opensearch.addi.dk/1.0/?action=search&query=mui&source=bibliotekdk&outputType=json&callback=foo", function(data) {
//    console.log("data", data);
//    console.log("eval(data)", eval(data));
    eval(data);
});
*/
require("xmodule").def("main",function(){
require("mui");

function main(mui) {
  mui.showPage(["page", {title: "Sp\xf8rg biblioteket"},
      ["section",
        ["input", {type: "textbox", name: "question", label: "Mit sp\xf8rgsm\xe5l"}],
        ["choice", {name: "deadline"},
          ["option", {value: "choose"}, "V\xe6lg tidsfrist..."],
          ["option", {value: "-1"}, "ingen"],
          ["option", {value: "2"}, "2 timer"],
          ["option", {value: "24"}, "24 timer"],
          ["option", {value: "48"}, "2 dage"],
          ["option", {value: "168"}, "1 uger"] ],
        ["choice", {name: "use"},
          ["option", {value: "choose"}, "Svaret skal bruges til..."],
          ["option", {value: "personal"}, "Almen interesse"],
          ["option", {value: "business"}, "Erhverv"],
          ["option", {value: "school1"}, "Folkeskole"],
          ["option", {value: "school2"}, "Gymnasium"],
          ["option", {value: "school3"}, "Videreg\xe5ende uddannelse"],
          ["option", {value: "school4"}, "Universitet/Forskning"] ],
        ["input", {type: "email", name: "email", label: "Min emailadresse"}],
        ["input", {type: "tel", name: "mobile", label: "Mit mobilnummer"}],
        ["choice", {name: "answer"},
          ["option", {value: "choose"}, "Jeg vil have svar p\xe5..."],
          ["option", {value: "email"}, "Email"],
          ["option", {value: "sms"}, "SMS"], ] ],
        ["button", {fn: ask}, "Sp\xf8rg"] ]);
}

function ask(mui) {     
  mui.loading();
  console.log("asking, form: ", mui.form);
  var deadline = "";
  if (mui.form.deadline !== "-1") {
    deadline = " indenfor de n\xe6ste " + mui.form.deadline + " timer";
  }
  var deadline = "";
  var answer = "";
  if (mui.form.answer === "email" && mui.form.email !== "") {
    answer = " p\xe5 " + mui.form.email; 
  } else if (mui.form.answer === "sms" && mui.form.mobile !== "") {
    answer = " via sms til " + mui.form.mobile;
  }
  mui.callJsonpWebservice("http://didicas.dbc.dk/openquestion.addi.dk/trunk/", "callback", 
    { action: "createQuestion",
      agencyId: "150024",
      qandaServiceName: "Biblioteksvagten",
      questionContent: mui.form.question,
      questionDeadline: mui.form.deadline,
      questionUsage: mui.form.use,
      userEmail: mui.form.email,
      outputType: "json"
    }, function(result) {
      if (result.createQuestionResponse.questionReceipt.$ === "Ack") {
        mui.showPage( ["page", {title: "Sp\xf8rg biblioteket"}, 
          ["section", 
            ["text", "Sp\xf8rgsm\xe5let er afleveret. Du vil f\xe5 svar", deadline, answer, "."], 
            ["button", {fn: main}, "Nyt sp\xf8rgsm\xe5l"]]]);
      } else {
        mui.showPage( ["page", {title: "Sp\xf8rg biblioteket"}, 
            ["text", "Noget gik desv\xe6rre galt, pr\xf8v igen"], 
            ["button", {fn: main}, "Nyt sp\xf8rgsm\xe5l"]]);
      }
    });
}

require("mui").setMain(main);
});
