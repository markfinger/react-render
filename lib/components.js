var _ = require('lodash');

module.exports = {
  _components: [],
  find: function(config) {
    return _.find(this._components, config);
  },
  add: function(component) {
    this._components.push(component);
  },
  clear: function() {
    this._components = [];
  }
};