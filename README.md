Sups
====

So, I'm thinking of something which exposes an interface somewhat...

```
var renderer = require('react-rendering-service');

var opts = {
  path: '/path/to/component.jsx',
  props: {
    // ...
  },
  serialisedProps: '...',
  watch: true,
  toStaticMarkup: true
};

renderer(opts, function(err, markup) {
    // ...
});
```

This would make using it via network or programmatic interfaces fairly similar.