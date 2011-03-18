// ### Main entry of the app.

// The responsibility of `exports.main` is to
// react on events and create the next 
// page in the user interface.
//
// Here, it is implemented as a dispatch on the pagename.
exports.main = function(env) {
    (handles[env.pagename] || handles["default"])(env);
}

// ### Dispatch table of pages to show
var handles = {

    // Default page to show
    //
    // `env.show` is responsible to show a page on the device. 
    // It should be called once, and only once, per dispatch.
    //
    // The `title` of the page, is possibly shown as a heading.
    //
    // The `next` dispatch will be called when the user 
    // is done with this page. Information about interactions with buttons,
    // and other widtets, will be passed to that dispatch via the `env`ironment.
    //
    // The `content` of the page to show is written in jsonml-format. For 
    // example `["button", "bibliotek.dk"]` will create a new button with
    // the label "bibliotek.dk".
    "default": function(env) {
            env.show( { 
                title: "demo",
                next: "default-dispatch",
                content: [
                    ["button", "bibliotek.dk"],
                    ["button", "fib"],
                    ["button", "ui-demo"],
                    ["button", "callback-demo"],
                    ["button", "default"]]});
    },

    // Dispatch function that is handles user input on the default page.
    // The `params` property of the `env`ironment contains the forms and 
    // buttons that the user has filled out or pressed. Redelegate the 
    // execution to the handler that has the same name as the button,
    // if such a handler exists, or else redelegate to the default handler.
    "default-dispatch": function(env) {
        (handles[env.params.button] || handles["default"])(env);
    },

    // Simple search form
    "bibliotek.dk": function(env) {
        var page = {};
        page.title = "bibliotek.dk";
        page.next = "search";
        page.content = [
            ["input", {name: "query"}],
            ["button", "Søg"]];
        env.show(page);
    },

    // Page with search results
    "search": function(env) {
        // When a callback can be passed to `env.show`,
        // the page will contain a list, where the elements
        // will be fetched on demand through the callback.
        env.show({
            callback: "search-callback",
            title: "Søgeresultater",
        });
    },

    // Callback for the search results. At every call, 
    // the `env`ironment will contain the `count` of 
    // elements to fetch, and the number of the `first`
    // element. The elements is passed is shown 
    // by the `entries` function, which should be called
    // once, and only once, when the callback is called.
    //
    // `remoteCall` is used to get data from a service,
    // and also takes a callback as a parameter.
    //
    // `entries` takes an object as a parameter,
    // where the `content`-property should contain
    // a list of entries, and `total`, if present,
    // should tell what the total possible number
    // of entries are, - where this function only
    // passes count of these on.
    "search-callback": function(env) {
        var query = env.params.query;
        var webservice = "http://localhost:1234/";

        env.remoteCall(webservice + "search", 
            {first: env.first, count: env.count, query: query}, 
            function(response) {

        var content;
        var result = {};
        result.first = env.first;
        result.count = response.entries.length;
        result.total = response.total;
        result.content = content = [];
        for(var i = 0; i < response.entries.length; ++i) {
            var entry = response.entries[i];
            var entryno = env.first + i;
            content.push(["entry", 
                {id: JSON.stringify([query, entryno]), next: "show-entry"}, 
                ["em", entry.author, ": "], 
                entry.title]);
        }

        env.entries(result);

        }); 
    },

    // Simple page example
    "ui-demo": function(env) {
        env.show({title: "ui-demo",
                next: "default",
                content: [
                    ["button", "button"], 
                    ["input", {label: "input with label"}]]})
    },

    // A callback example, simpler than the search example.
    "callback-demo": function(env) {
        env.show({callback: "callback-demo-callback"});
    },
    "callback-demo-callback": function(env) {
        var values = ["Once", "upon", "a", "midnight", "dreary", "while", 
                "I", "pondered", "weak", "and", "weary", "over", "many", 
                "a", "quaint", "an", "curious", "volume", "of", 
                "forgotten", "lore", "while", "i", "nodded", "nearly", 
                "napping", "suddenly", "there", "came", "a", "tapping"];

        var result = { total: values.length, content:[] };

        for(i = env.first; i < env.first + env.count && i < result.total; ++i) 
        {
            result.content.push(["entry", "result nr " + i + ": " + values[i]]);
        }
        env.entries(result);
    },

    // Another callback example, this time with fibonacci numbers
    "fib": function(env) {
        env.show({title: "Fibonacci numbers", callback: "fib-callback"});
    },

    "fib-callback": function(env) {
        function genfibs(n) {
            result = [1, 1];
            for(var i = 2; i < n; ++i) {
                result.push(result[i-1] + result[i-2]);
            }
            return result;
        }

        var fibs = genfibs(env.first + env.count);
        var result = {};
        result.total = 100000;
        result.content = [];
        for(var i = 0; i < env.count; ++i) {
            var n = i + env.first;
            result.content.push(["entry", "the " + (n+1) + 
                    "th Fibonacci number is: " + fibs[n]]);
        }
        env.entries(result);
    }

}
