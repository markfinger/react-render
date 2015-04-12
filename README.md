react-render
============

[![Build Status](https://travis-ci.org/markfinger/react-render.svg?branch=master)](https://travis-ci.org/markfinger/react-render)

A wrapper around React's markup rendering.


Installation
------------

```javascript
npm install react react-render
```


Usage
-----

```javascript
var reactRender = require('react-render');

reactRender({
  path: '/abs/path/to/component.jsx',
  props: {},
  serialisedProps: '...',
  toStaticMarkup: true
}, function(err, markup) {
  // ...
});
```
