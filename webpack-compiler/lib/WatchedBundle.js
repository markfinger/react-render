var _ = require('lodash');
var Bundle = require('./Bundle');
var chokidar = require('chokidar');

var WatchedBundle = function WatchedBundle(opts) {
  Bundle.call(this, opts);

  this.watchingConfig = false;
};

WatchedBundle.prototype = Object.create(Bundle.prototype);

WatchedBundle.prototype.getConfig = function getConfig(cb) {
  Bundle.prototype.getConfig.call(this, function(err, config) {
    if (err) return cb(err);

    if (this.opts.watchConfig && !this.watchingConfig && _.isString(this.opts.config)) {
      this.watchingConfig = true;
      this.watchFile(this.opts.config, this.invalidateConfig.bind(this));
    }

    cb(null, config);
  }.bind(this));
};

WatchedBundle.prototype.invalidateConfig = function invalidateConfig() {
  this.config = null;
  delete require.cache[this.opts.config];
  this.compiler = null;

  this.invalidate();
};

WatchedBundle._watchedFiles = {};

WatchedBundle._watcher = null;

WatchedBundle.prototype.watchFile = function watchFile(filename, cb) {
  if (!WatchedBundle._watcher) {
    WatchedBundle._watcher = new chokidar.FSWatcher();
    WatchedBundle._watcher.on('change', this.onFileChange);
  }

  if (WatchedBundle._watchedFiles[filename]) {
    WatchedBundle._watchedFiles[filename].push(cb);
  } else {
    WatchedBundle._watchedFiles[filename] = [cb];
    WatchedBundle._watcher.add(filename);
  }
};

WatchedBundle.prototype.onFileChange = function onFileChange(filename) {
  var callbacks = WatchedBundle._watchedFiles[filename];
  if (callbacks && callbacks.length) {
    callbacks.forEach(function(cb) {
      cb();
    });
  }
};

WatchedBundle._resetFileWatcher = function _resetFileWatcher() {
  if (WatchedBundle._watcher) {
    WatchedBundle._watcher.close();
    WatchedBundle._watcher = null;
  }
  WatchedBundle._watchedFiles = {};
};

module.exports = WatchedBundle;
