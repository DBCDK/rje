require("xmodule").def("Q.spec",function(){
require("Q");

describe("Q", function() {
  var unenc = "blah:/\\\n\r\tfo +o\xff\xe5\xa3\x75\x23\u1234\u6543\uf7e7&=-?#blah";
  var enc = "blah%3a%2f%5c%0a%0d%09fo%20%2bo%ff%e5%a3u%23%26%234660%3b%26%2325923%3b%26%2363463%3b%26%3d-%3f%23blah"
  var enc2 = "blah%3a%2f%5c%0a%0d%09fo+%2bo%ff%e5%a3u%23%26%234660%3b%26%2325923%3b%26%2363463%3b%26%3d-%3f%23blah"
  var Q = require("Q");

  beforeEach(function() {
  });

  it("escapes uri", function() {
    expect(Q.escapeUri(unenc)).toEqual(enc);
  });

  it("unescapes uri", function() {
    expect(Q.unescapeUri(enc)).toEqual(unenc);
    expect(Q.unescapeUri(enc2)).toEqual(unenc);
  });

});

});
