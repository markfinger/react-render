var _ = require('lodash');
var React = require('react');

var Component = function Component(opts) {
  this.component = opts.component;
  this.path = opts.path;
  this.factory = null;
};

Component.prototype.getPath = function getPath(cb) {
  cb(null, this.path);
};

Component.prototype.getComponent = function getComponent(cb) {
  if (this.component) {
    return cb(null, this.component);
  }

  this.getPath(function(err, path) {
    if (err) return cb(err);

    if (!path) {
      return cb(new Error('Component missing `path` and `component` properties'));
    }

    try {
      this.component = require(this.path);
    } catch(err) {
      return cb(err);
    }

    cb(null, this.component);
  }.bind(this));
};

Component.prototype.getFactory = function getFactory(cb) {
  if (this.factory) {
    return cb(null, this.factory);
  }

  this.getComponent(function(err, component) {
    if (err) return cb(err);

    try {
      this.factory = React.createFactory(component);
    } catch(err) {
      cb(err);
    }

    cb(null, this.factory);
  }.bind(this));
};

Component.prototype._render = function _render(props, toStaticMarkup, cb) {
  this.getFactory(function(err, factory) {
    if (err) return cb(err);

    var render = (
      toStaticMarkup ?
        React.renderToStaticMarkup :
        React.renderToString
    ).bind(React);

    try {
      var markup = render(factory(props));
    } catch(err) {
      return cb(err);
    }

    cb(null, markup);
  });
};

Component.prototype.renderToString = function renderToString(props, cb) {
  if (_.isFunction(props)) {
    cb = props;
    props = null;
  }

  this._render(props, false, cb);
};

Component.prototype.renderToStaticMarkup = function renderToStaticMarkup(props, cb) {
  if (_.isFunction(props)) {
    cb = props;
    props = null;
  }

  this._render(props, true, cb);
};

module.exports = Component;
