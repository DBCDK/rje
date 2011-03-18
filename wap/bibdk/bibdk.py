import xml.dom.minidom
import urllib
import urllib2
import cgi
import os

def bibdkRequest(request, startRecord = "1", maximumRecords = "10"):
    """Send a request to bibliotek.dk, and transform the result into json"""
    query = {}
    query['version'] = "1.1"
    query['operation'] = "searchRetrieve"
    query['query'] = request.encode("latin-1")
    query['maximumRecords'] = maximumRecords
    query['startRecord'] = startRecord
    query['recordSchema'] = "dc"
    
    params = urllib.urlencode(query)
    url = "http://webservice.bibliotek.dk/soeg?" + params
    
    dom = xml.dom.minidom.parse(urllib.urlopen(url))
    
    hits = dom.getElementsByTagName("numberOfRecords")[0].firstChild.data
    records = []
    recno = int(startRecord)
    for domrecord in dom.getElementsByTagName("recordData"):
        record = {"recno": str(recno)}
        for node in domrecord.firstChild.childNodes:
            nodename = node.nodeName
            if nodename is not '#text' and node.firstChild is not None:
                arr = record.get(nodename, [])
                arr.append(node.firstChild.data.replace("&", "&amp;"))
                record[nodename] = arr
        def swapname(name):
            t = name.split(",")
            if len(t) == 2:
                return t[1] + " " + t[0]
            return name
        if record.has_key("dc:creator"):
            record["dc:creator"] = map(swapname, record["dc:creator"])
        records.append(record)
        recno = recno + 1
    return {"hits": hits, "records": records, "query": request, "startRecord": startRecord}

# these are fields for requests
fields = ["dc.creator", "dc.title", "dc.subject", "dc.identifier", "cql.serverChoice", "dc.identifier", "dc.date", "dc.type", "dc.language", "bath.personalName", "bath.possessingInstitution", "rec.id", "bath.notes"]

# Utility functions for buiding ui tree
def title(txt): return ["title", txt]
def textinput(title, id): return ["textinput", title, id]
def button(title): return ["button", title]
def form(url, content): 
    result = ["form", url]
    result.extend(content)
    return result

pagetitle = "bibliotek dk"

def toXHTML(ui):
    """Transform a ui tree into jquery-mobile-html-code"""
    global pagetitle
    if type(ui) == str:
        return ui
    elif type(ui) == unicode:
        return ui
    elif ui[0] is "form":
        return u'<form action="%s" method="get">%s</form>' % (ui[1], u''.join(map(toXHTML, ui[2:])))
    elif ui[0] is "textinput":
        return u'<div><label for="%s">%s</label> <input type="text" inputmode="latin predictOff" name="%s" id="%s" value="" /></div>' % (ui[2], toXHTML(ui[1]), ui[2], ui[2])
    elif ui[0] is "button":
        return u'<div><input type="submit" value="%s" name="submit" /></div>' % (ui[1],)
    elif ui[0] is "links":
        return u'<div>%s<ul>%s</ul></div>' % (ui[1], u"".join([
            u'<li><a href="%s">%s</a><br/>%s</li>' % (e[0], toXHTML(e[1]), toXHTML(e[2])) for e in ui[2]]))
    elif ui[0] is "text":
        return u"".join(map(toXHTML, ui[1:]))
    elif ui[0] is "p":
        return u"<p>" + u"".join(map(toXHTML, ui[1:])) + u"</p>"
    elif ui[0] is "title":
        pagetitle =  u"".join(map(toHTML, ui[1:]))
        return ""
    elif ui[0] is "small":
        return "<small>" + u"".join(map(toXHTML, ui[1:])) + "</small>"
    elif ui[0] is "menu":
        return '<div>' + " ".join(['<a href="%s">%s</a>' % (e[0], toXHTML(e[1])) for e in ui[1:]]) + '</div>'
    else:
        return u"unknown ui: " + unicode(ui[0])

def toHTML(ui):
    """Transform a ui tree into jquery-mobile-html-code"""
    global pagetitle
    if type(ui) == str:
        return ui
    elif type(ui) == unicode:
        return ui
    elif ui[0] is "form":
        return u'<form action="%s" method="get"><div data-role="fieldcontain">%s</div></form>' % (ui[1], u''.join(map(toHTML, ui[2:])))
    elif ui[0] is "textinput":
        return u'<div><label for="%s">%s</label> <input type="text" inputmode="latin predictOff" name="%s" id="%s" value="" /></div>' % (ui[2], toHTML(ui[1]), ui[2], ui[2])
    elif ui[0] is "button":
        return u'<div><input type="submit" value="%s" name="submit" /></div>' % (ui[1],)
    elif ui[0] is "links":
        return u'<ul data-role="listview" data-inset="true" data-dividertheme="a"><li data-role="list-divider">%s</li>%s</ul>' % (ui[1], u"".join([
            u'<li><h3><a href="%s">%s</a></h3><p>%s</p></li>' % (e[0], toHTML(e[1]), toHTML(e[2])) for e in ui[2]]))
    elif ui[0] is "text":
        return u"".join(map(toHTML, ui[1:]))
    elif ui[0] is "p":
        return u"<div><p>" + u"".join(map(toXHTML, ui[1:])) + u"</p></div>"
    elif ui[0] is "small":
        return u"<small>" + u"".join(map(toHTML, ui[1:])) + u"</small>"
    elif ui[0] is "title":
        pagetitle =  u"".join(map(toHTML, ui[1:]))
        return ""
    elif ui[0] is "menu":
        return '<div>' + " ".join(['<a data-role="button" data-inline="true" href="%s">%s</a>' % (e[0], toHTML(e[1])) for e in ui[1:]]) + '</div>'
    else:
        return u"unknown ui: " + str(ui[0])

searchform = form("/bib", [
    ["title", "bibliotek dk"],
    textinput("Forfatter:", "dc.creator"), 
    textinput("Titel:", "dc.title"), 
    textinput("Emne:", "dc.subject"), 
    textinput("Fritekst:", "cql.serverChoice"), 
    button("S&#248;g")])

xhtmlheader = '<!DOCTYPE html PUBLIC "-//OMA//DTD XHTML Mobile 1.2//EN" "http://www.openmobilealliance.org/tech/DTD/xhtml-mobile12.dtd"><html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en"><head><title>%(pagetitle)s</title><style type="text/css">body { margin: 1%% 2%% 1%% 2%%; font-family: sans-serif; line-height: 130%%; }</style></head><body><h1>%(pagetitle)s</h1>'
xhtmlfooter = '</body></html>'
htmlheader = '<!DOCTYPE html><html><head><title>%(pagetitle)s</title><link rel="stylesheet" href="/static/jquery.mobile.min.css" /><script src="http://code.jquery.com/jquery-1.4.4.min.js" type="text/ecmascript"></script><script src="/static/jquery.mobile.min.js" type="text/ecmascript"></script></head><body><div data-role="page" data-theme="b"><div data-role="header"><h1>%(pagetitle)s</h1></div><div data-role="content">'
htmlfooter = '</div></div></body></html>'

def cons(a, b):
    result = [a]
    result.extend(b)
    return result

def push(list, val):
    list.append(val)
    return list

def text(*args):
    return cons("text", args)

def links(*args):
    return cons("links", args)

def printrecords(result):
    hits = int(result["hits"]) 
    startRecord = int(result['startRecord'])
    endRecord = startRecord + len(result['records']) - 1
    if startRecord > endRecord:
        startRecord = endRecord

    def shortRecordFormat(record):
        uri = record['dc:identifier'][0]
        uri = u"/bib?" + urllib.urlencode({"query": result["query"].encode("utf-8"), "startRecord": record["recno"], "singleRecord": True}).replace("&", "&amp;")
        title = ["text", record.get('dc:title', ['Uden titel'])[0], ["small", " (" + ", ".join(record.get('dc:date', [''])) + ") "]]
        subtitle = u" &amp; ".join(record.get('dc:creator', ['N.N.']))
        return [uri, title, subtitle]

    menu = ["menu"]
    #menu = ["menu", ["javascript:history.back(-1)", "Tilbage"]]
    if endRecord < hits:
        menu.append(["/bib?" + urllib.urlencode({"query": result["query"].encode("utf-8"), "startRecord": endRecord + 1}).replace("&", "&amp;"), "N&#230;ste"])
    menu.append(["/bib", "Ny s&#248;gning"])

    return text(["p",'S&#248;gning: "', result["query"], '"'],
            links('Viser post %d-%d ud af %d' % (startRecord, endRecord, hits), map(shortRecordFormat, result["records"])),
            menu)

def sort(x):
    x.sort()
    return x
def printrecord(result):
    acc = cons("text", [["p", ["small", key], " ", ", ".join(result["records"][0][key])] for key in sort(result["records"][0].keys()) if not key is "recno"]);
    menu = ["menu"]
    #menu.append(["javascript:history.back(-1)", "Tilbage"])
    menu.append(["javascript:alert('Not implemented yet')", "Bestil"])
    menu.append(["/bib", "Ny s&#248;gning"])
    return text(acc, menu)


smartphone = False
def printheader():
    global smartphone
    if "WebKit" in os.environ.get("HTTP_USER_AGENT", ""):
        smartphone = True

    print "Content-Type: ",
    if not smartphone:
        accept = os.environ.get("HTTP_ACCEPT", "")
        if "application/vnd.wap.xhtml+xml" in accept:
            print "application/vnd.wap.xhtml+xml; charset=UTF-8\n"
        elif "application/xhtml+xml" in accept:
            print "application/xhtml+xml; charset=UTF-8\n"
        else:
            print "text/html; charset=UTF-8\n"
        print xhtmlheader % {"pagetitle": pagetitle}
    else:
        print "text/html; charset=UTF-8\n"
        print htmlheader % {"pagetitle": pagetitle}

def printbody(body):
    #print body
    if smartphone:
        print toHTML(body).encode('utf-8')
    else:
        print toXHTML(body).encode('utf-8')

def printfooter():
    if smartphone:
        print htmlfooter
    else:
        print xhtmlfooter

def main():
    printheader()
    form = cgi.FieldStorage()
    params = {}
    for key in form:
        params[key] = form.getvalue(key)

    search = []
    for param in params:
        if param in fields:
            for word in params.get(param).split():
                search.append(u"%s = (%s)" % (param, unicode(word, "utf-8")))
    search = u" and ".join(search)
    search = search or unicode(params.get("query", ""), "utf-8")

    if len(search) is 0:
        printbody(searchform)
    elif params.get("singleRecord", False):
        result = bibdkRequest(search, params.get("startRecord", "1"), 1)
        printbody(printrecord(result))
    else:
        result = bibdkRequest(search, params.get("startRecord", "1"))
        printbody(printrecords(result))

    printfooter()
    import mylogger
    mylogger.log("")
