function searchresults(query) {
    var first = true;
    var start = 1;
    var step = 5;
    var hitcount;
    if(!query) {
        return function(mui) {
            mui.append("");
        }
    }
    return function resultsFn(mui) {
        mui.callJsonpWebservice('http://opensearch.addi.dk/1.0/', 'callback', 
        {
            action: 'search', 
            query: query,
            source: 'bibliotekdk', 
            start: start, 
            stepValue: step, 
            outputType: 'json'}, 
            function(data) { 
                console.log("result:", data); 
                if(first) {
                    hitcount =  +data.searchResponse.result.hitCount.$;
                    mui.append('Searching for "' + query + '" yielded ' + hitcount + ' hits');
                    first = false;
                }
                var results = data.searchResponse.result.searchResult;
                console.log("results:", results); 
                if(results) {
                for(var i=0; i < results.length;++i) {
                    mui.append('<hr>');
                    mui.append(
                        '<div>' + (start+i) + ": "+ JSON.stringify(results[i].collection.object.record.title)+ "<br />"+
                        JSON.stringify(results[i].collection.object.record.creator) + "</div>"

                    );
                    console.log(JSON.stringify(results[i].collection.object.record.title));
                }
                start+=step;
                if(start <= hitcount) {
                    mui.more(resultsFn);
                }
                } 
            });
    }
}
function search(mui) {
    var query = mui.formValue("query");
    mui.showPage(["page", {title: "Dynamic result"},
        ["section",
        ["section", ["input", {type: "text", name: "query", label: "Søgestreng"}]],
        ["button", {fn: search}, "Søg"]],
        ["section", {autocontent: searchresults(query)}]]
        );
}
mui.setMain(search);
