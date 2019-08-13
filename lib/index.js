const _ = require('lodash');
const Component = require('./Component');

const components = {
  _cache: [],
  find: function(opts) {
    return _.find(this._cache, function(obj) {
      return _.isEqual(obj.opts, opts);
    });
  },
  add: function(obj) {
    this._cache.push(obj);
  },
  clear: function() {
    this._cache = [];
  }
};

const reactRender = function reactRender(opts, cb) {
  const _opts = _.pick(opts, 'component', 'path', 'noCache');

  let component;
  if (_opts.noCache) {
    component = new Component(_opts);
  } else {
    component = components.find(_opts);

    if (!component) {
      component = new Component(_opts);
      components.add(component);
    }
  }

  let props = opts.props;
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

reactRender._components = components;

module.exports = reactRender;
