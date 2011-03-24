# JavaScript Modules

## GUI `mui*`

The actual user interface abstraction, which allows the same code to target different platforms
    - Smartphones/HTML5 `muiApp.*`
    - TODO: WAP/HTML-MP `muiWap.*`
    - TODO: ../j2me

## Module loader `xmodule.js`

Module system designed, such that modules can be used unaltered,
in the browser, in LightScript, and also with the CommonJS module system.

Modules are defined like this:

    require("xmodule").def("$YOUR_MODULE_NAME", function() {
        ... require("...") ...
        ... exports.... = ...
    });


Loading xmodu adds the following objects to the global scope, if none of them are defined:

    - `require("`modulename`")` used for loading a module
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


