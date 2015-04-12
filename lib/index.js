var _ = require('lodash');
var Component = require('./Component');
var cache = require('./cache');

var reactRender = function reactRender(opts, cb) {
  var _opts = _.pick(opts, 'component', 'path');

  var component = cache.find(_opts);

  if (!component) {
    component = new Component(_opts);
    cache.add(component);
  }

  var props = opts.props;
  if (!props && opts.serializedProps) {
    try {
      props = JSON.parse(opts.serializedProps);
    } catch(err) {
      cb(err);
    }
  }

  if (opts.toStaticMarkup) {
    component.renderToStaticMarkup(props, cb);
  } else {
    component.renderToString(props, cb);
  }
};

module.exports = reactRender;