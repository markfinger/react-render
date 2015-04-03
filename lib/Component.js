var React = require('react');

var Component = function Component(config) {
  this.component = config.component;
  this.path = config.path;
  this.factory = null;
};

Component.prototype.getComponent = function(cb) {
  if (!this.component) {
    if (!this.path) {
      return cb(new Error('Component `path` has not been defined'));
    }

    try {
      this.component = require(this.path);
    } catch(err) {
      return cb(err);
    }
  }

  cb(null, this.component);
};

Component.prototype.getFactory = function(cb) {
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

Component.prototype.render = function(props, toStaticMarkup, cb) {
  this.getFactory(function(err, factory) {
    if (err) return cb(err);

    var reactRenderTo = (
      toStaticMarkup ?
        React.renderToStaticMarkup :
        React.renderToString
    ).bind(React);

    try {
      var markup = reactRenderTo(factory(props));
    } catch(err) {
      return cb(err);
    }

    cb(null, markup);
  });
};

module.exports = Component;
