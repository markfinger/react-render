{
  "private": true,
  "dependencies": {
    "babel": "^4.7.5",
    "babel-core": "^4.7.5",
    "babel-loader": "^4.1.0",
    "lodash": "^3.5.0",
    "resolve": "^1.1.5",
    "tmp": "0.0.25",
    "webpack": "^1.7.2",
    "webpack-watcher": "git://github.com/markfinger/webpack-watcher#b95b031434e4cdb52f2640d56be28b95429bc9ce"
  }
}


```javascript
var renderer = require('react-rendering-service');

var opts = {
  path: '/path/to/component.jsx',
  props: {
    // ...
  },
  serialisedProps: JSON.stringify({
  // ...
  }),
  watch: true,
  toStaticMarkup: true
};

renderer(opts, function(err, output) {
    // ...
});
```

This would make using it via network or programmatic interfaces fairly similar.
