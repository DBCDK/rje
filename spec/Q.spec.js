require("xmodule").def("Q.spec",function(){
    require("Q");

    describe("Q", function() {
        var unenc = "blah:/\\\n\r\tfo +o\xff\xe5\xa3\x75\x23\u1234\u6543\uf7e7&=-?#blah";
        var enc = "blah%3a%2f%5c%0a%0d%09fo%20%2bo%ff%e5%a3u%23%26%234660%3b%26%2325923%3b%26%2363463%3b%26%3d-%3f%23blah"
        var enc2 = "blah%3a%2f%5c%0a%0d%09fo+%2bo%ff%e5%a3u%23%26%234660%3b%26%2325923%3b%26%2363463%3b%26%3d-%3f%23blah"
        var Q = require("Q");
        var serviceUrl = "http://opensearch.addi.dk/1.0/?action=search&query=mui&source=bibliotekdk&outputType=json"
        var serviceurlCallback = serviceUrl + "&callback=QSpecCallback";
        var service = "http://opensearch.addi.dk/1.0/";
        var serviceArgs = {action: "search", query: "mui", source: "bibliotek.dk", outputType: "json"};
        var cbResult;

        beforeEach(function() {
            global.QSpecCallback = function(data) {
                cbResult = data;
            };
            cbResult = undefined;
        });

        afterEach(function() {
            delete global.QSpecCallback;
        });

        it("executes remote scripts", function() {
            Q.executeRemote(serviceurlCallback);
            waitsFor(function() {
                return cbResult;
            }, 10000);
            runs(function() {
                // validate cb Result
            });
        });

        it("makes jsonp requests", function() {
            Q.callJsonpWebservice(service, "callback", serviceArgs, QSpecCallback);
            waitsFor(function() {
                return cbResult;
            }, 10000);
            runs(function() {
                // validate cb Result
            });
        });

        it("encodes url parameters", function() {
            expect(Q.encodeUrlParameters({foo:1,bar:"42"})).toEqual("foo=1&bar=42");
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
