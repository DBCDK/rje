require("xmodule").def("testtest",function(){

describe("number test", function() {
  var a, b;

  beforeEach(function() {
    a = 17;
    b = 42;
  });

  it("should be 17 and 42", function() {
    expect(a).toEqual(17);
    expect(b).toEqual(42);
  });
});

});
