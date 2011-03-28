require("xmodule").def("jsonml.spec",function(){
require("jsonml");

describe("jsonml test", function() {
  var a, b;
  var html_x, html_j;
  var jsonml;

  beforeEach(function() {
    a = ["foo", {bar: 12}, "baz"];
    html_x = "<html><head><title>Hello world</title></head><body>Hello<hr /></body></html>";
    html_j = ["html", ["head", ["title", "Hello world"]], ["body", "Hello", ["hr"]]];
    jsonml = require("jsonml");
  });

  it("parse xml", function() {
    expect(jsonml.fromXml(html_x)).toEqual(html_j);
  });

  it("output xml", function() {
    expect(jsonml.toXml(html_j)).toEqual(html_x);
  });
});

});
