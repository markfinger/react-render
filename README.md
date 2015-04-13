react-render
============

[![Build Status](https://travis-ci.org/markfinger/react-render.svg?branch=master)](https://travis-ci.org/markfinger/react-render)

Handles the simple use case of loading in a component and rendering it to markup.

The renderer will attempt to avoid React version incompatibilities by resolving
a path from your component to the local React package.


Installation
------------

```javascript
npm install react-render
```


Usage
-----

```javascript
var reactRender = require('react-render');

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
  toStaticMarkup: true

  // An absolute path that can be used to load the version of React.
  // If the renderer can not find React from the component's path, you
  // can specify it.
  pathToReact: '...'

}, function(err, markup) {
  if (err) throw err;

  console.log(markup);
});
```
