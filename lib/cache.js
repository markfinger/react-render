var _ = require('lodash');

module.exports = {
  _cache: [],
  find: function(func, opts) {
    var matches = _.matches(opts);
    return _.find(this._cache, function(obj) {
      return obj instanceof func && matches(obj);
    });
  },
  add: function(obj) {
    this._cache.push(obj);
  },
  clear: function() {
    this._cache = [];
  }
};