# Mobile user interface

The goal of this project is to create a cross-platform mobile user interface that runs both as a html5-app(android/iphone/palm/smartphones), j2me-midlet(most other phones), and a wap2-mobile-site.

Applications are written in a subset of JavaScript in order to be able to run on all platforms.


# Modules

## Mobile User Interface -  `mui*.js`


The start of the program is defined using the `setMain` function which takes a Mui Callback as a parameter. For example:

    require('mui').setMain(main);

    function main(mui) {
        mui.showPage(["page", ["text", "Hello world"]]);
    }

Mui Callbacks are the functions that are passed to Mui, and which will be called, when new content are needed to be shown to the user, for example when the program starts and when the user submits a form. 
A Mui Callback is an unary function, taking a Mui Object as a parameter. 
When a callback is called, it must call a method on the Mui Object which shows new content (currently only mui.showPage(...)).

Mui Objects are only available to callbacks, and contains the following properties:

- `mui.session` is an initially empty object where the application can store data, which will be available in futher callbacks in the same session.
- `mui.storage.getItem(key)` retrieve a value for a given key in a persistent storage linked to the current device.
- `mui.storage.setItem(key, value)` sets an item in the storage. The value should be JSON-serialisable.
- `mui.storage.removeItem(key)` deletes an item in the storage.
- `mui.loading()` indicates loading activity to the user.
- `mui.callJsonpWebservice(url, callbackParameterName, args, callback)` calls a web service. `url` is the url of the web service, `callbackParameterName` is the parameter to the service which names the [padding function](http://en.wikipedia.org/wiki/JSONP), `args` is an object of arguments which are to be passed to the url, and `callback` is an unary JavaScript function which will be called with result of the web service, or `undefined` if the service fails or times out.
- `mui.showPage(muiPage)` displays a page that the user can interact with.
- `mui.form` contains results of form elements that the user interacted with on the previous page, if applicable.

Mui Pages are passed to `showPage`, and are user interface descriptions written in [JsonML array form](http://en.wikipedia.org/wiki/JsonML) with the addition that JavaScript-functions may also be values some of the places. Mui Pages has the following elements:

- `page` is the tag type of the root elements, with the following attributes:
    - `title` is shown on the top of the page, optional
- `section` groups other elements
- `text` is displayed text
- `input` enables the user to input a value. It has the following attributes:
    - `label` optional label shown with the input element
    - `type` indicates the kind of input, - it is mandatory and must be one of the following:
        - `text` a line of text
        - `textbox` some lines of text
        - `tel`ephone number
        - `email` address
    - `name` is used to reference the result in `mui.form`, mandatory
    - TODO: `validateFn` a JavaScript function that will be called with the content of the input, and should return truthy if the input is valid
    - TODO: `validateHint` will be shown when the user enters an invalid value in the input
- `choice` a collection of options, between which the user must select. Only `option` nodes are allowed as child elements. It has the following attributes:
    - `label` optional label shown with the choice group
    - `name` is used to reference the result in `mui.form`, mandatory
- `option` an option the user can choose.  Must be child elements of select. It has the following attributes:
    - `value` the value this choice will return to the program in the `mui.form`.
- `button` is a clickable button with the following attributes:
    - `fn` the Mui Callback function to invoke when the button is pressed.


## Module loader `xmodule.js`

Module system designed, such that modules can be used unaltered,
in the browser, in LightScript, and also with the CommonJS module system.

Modules are defined like this:

    require("xmodule").def("$YOUR_MODULE_NAME", function() {
        ... require("...") ...
        ... exports.... = ...
    });


Loading xmodule adds the following objects to the global scope, if none of them are defined:

- `require("$YOUR_MODULE_NAME")` used for loading a module
- `exports` - before loading a module, this will be created as an empty object. Properties set on this object will be available when the module is `require`d.

When defining your module, `$YOUR_MODULE_NAME` should be the same as the name of the file containg the module.
Also notice that if your module `require`s a module that is not loaded yet, `require` will throw an exception to stop execution of your module, load the required module, and then try to reinitialise your module by calling its function again, - thus exceptions from require should not be caught.

## JsonML support `jsonml.js`

Utilities for parsing and working with jsonml in array form.

More info on JsonML at [jsonml.org](http://jsonml.org/) and [wikipedia](http://en.wikipedia.org/wiki/JsonML)

This module implements the following functions:

- `jsonml.fromXml(xml_string)` converts a string containing xml to jsonml in array form
- `jsonml.toXml(jsonml_array)` converts jsonml in array form to xml
- `jsonml.toObject(jsonml_array)` converts jsonml in array form to an easier subscriptable object
- `jsonml.childReduce(jsonml_array, callback_function(accumulator, child_element), initial_value)` applies the callback function to each child element of the jsonml array
- `jsonml.getAttr(jsonml_array, attributename)` retrieves the value of a given attribute of the jsonml array or undefined if the attribute is not defined

## Various utility functions `Q.js`

- `Q.escapeUri(str)` uri-escape that works (the one in the EcmaScript Standard has issues with non-latin1 characters)
- `Q.unescapeUri(str)` uri-escape that works (the one in the EcmaScript Standard has issues with non-latin1 characters)
- `Q.pick(array)` returns a random element from an array
- `Q.randint(n)` returns a random non-negative integer less than n

## External modules

MUI also includes the following modules:

- JavaScript utility functions
    - [es5-shim.js](https://github.com/kriskowal/es5-shim/)
    - [underscore.js](http://documentcloud.github.com/underscore/)
    - [json2.js](https://github.com/douglascrockford/JSON-js)
    - [phonegap.0.9.4.js](http://www.phonegap.com/)
- Unit testing
    - [Jasmine 1.0.2](http://pivotal.github.com/jasmine/)

# Unit testing

Unit tests can be run in the browser by opening `spec/testrunner.html`. If more test-files has been added `spec/testrunner.html` can be regenerated by `cd spec; python genhtml.py > testrunner.html`.  To run tests with node, install jasbin with npm, and run: `NODE_PATH=mui jasbin`

# Other

The following programs and libraries is also used during development

- [phonegap](http://www.phonegap.com/)
- [docco](https://github.com/jashkenas/docco)
