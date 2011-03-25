filter(fn, list) = {
    filterfn(elem, acc) = {
        if (fn(elem)) {
            array_push(acc, elem);
        };
        return acc;
    };
    return fold(filterfn, list, []);
};
first = (x) -> x[0];
puts(x) = {
    print(x);
};
putandreturn(obj, key, value) = {
    obj[key] = value;
    return obj;
};
findtag(tagname, xml) = {
    return first(filter((x) -> x[0] == tagname, tail(xml, 2)));
};
biblookup(query, firstRecord) = {
    query = query || "dc.creator = (jensen) and dc.title = (klit)";
    firstRecord = firstRecord || 1;
    response = parsexml(httpget("http://webservice.bibliotek.dk/soeg", {
        "version": "1.1",
        "operation": "searchRetrieve",
        "query": query,
        "maximumRecords": 10,
        "startRecord": firstRecord,
        "recordSchema": "dc"
    }));
    var numrecs = findtag("numberOfRecords", response)[2];
    records = tail(findtag("records", response), 2);
    // Find the subtag in the records which has the actual data
    records = map((a) -> tail(findtag("dc:dc", findtag("recordData", a)), 2), records);
    // Transform the records into tables for easier access
    handleEntry(elem, acc) = {
        str = array_join(tail(elem, 2), "");
        if (str != "") {
            entry = get(acc, elem[0], []);
            array_push(entry, str);
            acc[elem[0]] = entry;
        };
        return acc;
    };
    records = map((record) -> fold(handleEntry, record, {}), records);
    return {
        "firstRecord": firstRecord,
        "lastRecord": firstRecord + len(records) - 1,
        "totalHits": numrecs,
        "records": records
    };
};
searchstr(req) = {
    var fields = ["dc.creator", "dc.title", "dc.subject", "dc.identifier", "cql.serverChoice", "dc.identifier", "dc.date", "dc.type", "dc.language", "bath.personalName", "bath.possessingInstitution", "rec.id", "bath.notes"];
    var searchfields = filter(x -> contains(fields, x), keys(req["params"]));
    return array_join(map(x -> x + " = (" + req["params"][x] + ")", searchfields), " and ");
}
title = (txt) -> ["title", txt];
textinput = (title, id) -> ["textinput", title, id];
button = (title, action) -> ["button", title, action];
searchform = [title("bibiotek"), textinput("Forfatter:", "dc.creator"), textinput("Titel:", "dc.title"), textinput("Emne:", "dc.subject"), textinput("Fritekst:", "cql.serverChoice"), button("S&oslash;g", "search")]
searchresult(q, req) = {
    return biblookup(q, get(req, "firstRecord", undefined));
}
mpwidget(w) = {
    type = first(w);
    if(type === "textinput") {
        var title = w[1];
        var id = w[2];
        return '<div><label for="' + id + ' ">' + title + '</label> <input type="text" inputmode="latin predictOff" name="' + id + '" id="' + id + '" value="" /></div>';
    } else if(type === "button") {
        var title = w[1];
        return '<div><input type="submit" value="' + title + '" name="action" /></div>'
    } else if(type === "title") {
        var title = w[1];
        return '<h1>' + title + '</h1>'
    } else {
        return w;
    };
};
show(form, req) = {
    print('<form action="/site" method="get">');
    form = map(mpwidget, form);
    print(form);
    print('</form>');
}
request(req) = {
    print("Content-Type: text/html; charset=UTF-8\n");
    print("<html><body>");
    print(req);
    q = searchstr(req);
    print(q);
    if(q == "") {
        show(searchform, req)
    } else {
        show(searchresult(q, req), req);
    }
};
