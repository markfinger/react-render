var _ = require('lodash');
var Bundle = require('./Bundle');
var chokidar = require('chokidar');

var WatchedBundle = function WatchedBundle(opts) {
  Bundle.call(this, opts);
};

WatchedBundle.prototype = Object.create(Bundle.prototype);

module.exports = WatchedBundle;
