react-render
============

[![Build Status](https://travis-ci.org/markfinger/react-render.svg?branch=master)](https://travis-ci.org/markfinger/react-render)

Handles the simple use case of importing a component and rendering it to markup.


Installation
------------

```javascript
npm install react-render
```


Usage
-----

```javascript
const reactRender = require('react-render');

reactRender({

  // An absolute path to a module exporting your component
  path: '/abs/path/to/component.js',

  // Optional
  // --------

  // A string containing a JSON-serialized object which will be used
  // during rendering
  serialisedProps: '...',

  // An object which will be used during rendering
  props: {},

  // A flag indicating if you wish to render the component to static
  // markup. Defaults to false.
  toStaticMarkup: true,

  // A flag indicating if you wish to disable caching for components. This is
  // especially useful in development. Defaults to false.
  noCache: false

}, function(err, markup) {
  if (err) throw err;

  console.log(markup);
});
```
