var _ = require('lodash');

module.exports = {
  _cache: [],
  find: function(func, opts) {
    return _.find(this._cache, function(obj) {
      return obj instanceof func && _.isEqual(opts, obj.cacheKey);
    });
  },
  add: function(obj) {
    this._cache.push(obj);
  },
  clear: function() {
    this._cache = [];
  }
};