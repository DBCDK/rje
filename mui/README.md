# Mobile User Interface


# Modules

## Mobile User Interface -  `mui*.js`


The program starts with the Mui Callback function passed to `setMain(...)`.  A minimal program could be defined like:

    mui.setMain(main);

    function main(mui) {
        mui.showPage(["page", ["text", "Hello world"]]);
    }

Mui Callbacks are the functions that are passed to Mui. They will be called, when new content are needed to be shown to the user, for example when the program starts or when the user submits a form. 
A Mui Callback is an unary function, taking a Mui Object as the parameter. 
When a callback is called, it must call a method on the Mui Object which shows new content (currently only mui.showPage(...)).

Mui Objects are only available to callbacks, and contains the following properties:

- `mui.session` is an initially empty object where the application can store data, which will be available in futher callbacks in the same session.
- `mui.storage.getItem(key)` retrieve a value for a given key in a persistent storage linked to the current device.
- `mui.storage.setItem(key, value)` sets an item in the storage. The value should be JSON-serialisable.
- `mui.loading()` indicates loading activity to the user.
- `mui.callJsonpWebservice(url, callbackParameterName, args, callback)` calls a web service. `url` is the url of the web service, `callbackParameterName` is the parameter to the service which names the [padding function](http://en.wikipedia.org/wiki/JSONP), `args` is an object of arguments which are to be passed to the url, and `callback` is an unary JavaScript function which will be called with result of the web service, or `undefined` if the service fails or times out.
- `mui.showPage(muiPage)` displays a page that the user can interact with.
- `mui.formValue(name)` returns the content of a named form element that the user interacted with on the previous page.
- `mui.prevPage()` returns previous shown page, if applicable.
- `mui.setHints(page, hints)` add a hint text to named inputs and choices in the form, - useful for showing errors after input validating. `hints` is an object with names mapping to hint-strings.

Mui Pages are user interface descriptions passed that are to `showPage`. They are written in [JsonML array form](http://en.wikipedia.org/wiki/JsonML) with the addition that JavaScript-functions may also be values some of the places. Mui Pages has the following elements:

- `page` is the tag type of the root elements, with the following attributes:
    - `title` is shown on the top of the page, optional
- `section` groups other elements
    -  `autocontent` function used for autoexpanded content, such as search results, - only one of these per page, as they autoexpand and loads more content, and it thus may not be possible to scroll across them. The autocontent function gets an mui object which also has an `append` method for adding content, and a `more` method which can be used to designate a function to be called fo more content
- `text` is displayed text
- `input` enables the user to input a value. It has the following attributes:
    - `label` optional label shown with the input element
    - `type` indicates the kind of input, - it is mandatory and must be one of the following:
        - `text` a line of text
        - `textbox` some lines of text
        - `tel`ephone number
        - `email` address
    - `name` is used to reference the result in `mui.form`, mandatory
    - `hint` - hint text added at the input
- `choice` a collection of options, between which the user must select. Only `option` nodes are allowed as child elements. It has the following attributes:
    - `label` optional label shown with the choice group
    - `name` is used to reference the result in `mui.form`, mandatory
- `option` an option the user can choose.  Must be child elements of select. It has the following attributes:
    - `value` the value this choice will return to the program in the `mui.form`.
- `button` is a clickable button with the following attributes:
    - `fn` the Mui Callback function to invoke when the button is pressed.

## JsonML support `jsonml.js`

Utilities for parsing and working with jsonml in array form.

More info on JsonML at [jsonml.org](http://jsonml.org/) and [wikipedia](http://en.wikipedia.org/wiki/JsonML)

This module implements the following functions:

- `jsonml.fromXml(xml_string)` converts a string containing xml to jsonml in array form
- `jsonml.toXml(jsonml_array)` converts jsonml in array form to xml
- `jsonml.toObject(jsonml_array)` converts jsonml in array form to an easier subscriptable object
- `jsonml.childReduce(jsonml_array, callback_function(accumulator, child_element), initial_value)` applies the callback function to each child element of the jsonml array
- `jsonml.getAttr(jsonml_array, attributename)` retrieves the value of a given attribute of the jsonml array or undefined if the attribute is not defined

# Documentation
This overview document is `README.md`, and can be transformed into a printable document with `markdown2pdf README.md` if pandoc is installed. Implementation documentation can be generated with the command `docco */*.js`, given docco is installed.
