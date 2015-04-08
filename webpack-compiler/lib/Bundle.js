var webpack = require('webpack');
var _ = require('lodash');
var chokidar = require('chokidar');

var Bundle = function Bundle(opts) {
  this.opts = opts;
  this.cacheKey = opts;

  this.watchingConfig = false;

  this.compiler = null;
  this.isCompiling = false;
  this.hasCompiled = false;
  this._onceDone = [];

  this.err = null;
  this.stats = null;
};

Bundle.prototype.invalidate = function invalidate() {
  this.isCompiling = false;
  this.hasCompiled = false;
  this.err = null;
  this.stats = null;
};

Bundle.prototype.invalidateConfig = function invalidateConfig() {
  this.config = null;
  delete require.cache[this.opts.config];
  this.compiler = null;
  this.invalidate();
};

Bundle.prototype.getConfig = function getConfig(cb) {
  if (this.config) {
    return cb(null, this.config);
  }

  if (!this.opts.config) {
    return cb(new Error('Bundle options missing `config` value'));
  }

  this.config = this.opts.config;

  if (_.isString(this.config)) {
    try {
      this.config = require(this.config);
    } catch(err) {
      return cb(err);
    }
  }

  if (this.opts.watchConfig && !this.watchingConfig && _.isString(this.opts.config)) {
    this.watchingConfig = true;
    this.watchFile(this.opts.config, this.invalidateConfig.bind(this));
  }

  cb(null, this.config)
};

Bundle.prototype.getCompiler = function getCompiler(cb) {
  if (this.compiler) {
    return cb(null, this.compiler);
  }

  this.getConfig(function(err, config) {
    if (err) return cb(err);

    this.compiler = webpack(config);

    cb(null, this.compiler);
  }.bind(this));
};

Bundle.prototype.compile = function compile(cb) {
  this.getCompiler(function(err, compiler) {
    if (err) return cb(err);

    this.invalidate();
    this.isCompiling = true;

    compiler.run(function(err, stats) {
      this.err = err;
      this.stats = stats;
      this.isCompiling = false;
      this.hasCompiled = !err;

      // TODO: handle stats.hasErrors, stats.hasWarnings

      if (cb) {
        cb(err, stats);
      }
    }.bind(this));
  }.bind(this));
};

Bundle.prototype.onceDone = function onceDone(cb) {
  this._onceDone.push(cb);

  if (this.hasCompiled) {
    this.callDone(this.err, this.stats);
  } else if (!this.isCompiling) {
    this.compile(this.callDone.bind(this));
  }
};

Bundle.prototype.callDone = function callDone(err, stats) {
  var _onceDone = this._onceDone;
  this._onceDone = [];

  _onceDone.forEach(function(cb) {
    cb(err, stats);
  }, this);
};

Bundle._watchedFiles = {};

Bundle._watcher = null;

Bundle.prototype.watchFile = function watchFile(filename, cb) {
  if (!Bundle._watcher) {
    Bundle._watcher = new chokidar.FSWatcher();
    Bundle._watcher.on('change', this.onFileChange);
  }

  if (Bundle._watchedFiles[filename]) {
    Bundle._watchedFiles[filename].push(cb);
  } else {
    Bundle._watchedFiles[filename] = [cb];
    Bundle._watcher.add(filename);
  }
};

Bundle.prototype.onFileChange = function onFileChange(filename) {
  var callbacks = Bundle._watchedFiles[filename];
  if (callbacks && callbacks.length) {
    callbacks.forEach(function(cb) {
      cb();
    });
  }
};

Bundle._resetFileWatcher = function _resetFileWatcher() {
  if (Bundle._watcher) {
    Bundle._watcher.close();
    Bundle._watcher = null;
  }
  Bundle._watchedFiles = {};
};

module.exports = Bundle;