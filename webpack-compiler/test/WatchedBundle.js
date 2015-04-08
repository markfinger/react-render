var fs = require('fs');
var path = require('path');
var child_process = require('child_process');
var assert = require('chai').assert;
var mkdirp = require('mkdirp');
var _ = require('lodash');
var Bundle = require('../lib/Bundle');
var WatchedBundle = require('../lib/WatchedBundle');

var TEST_OUTPUT_DIR = path.join(__dirname, 'watched_bundle_test_output');

beforeEach(function() {
  child_process.spawnSync('rm', ['-rf', TEST_OUTPUT_DIR]);
});

afterEach(function() {
  WatchedBundle._resetFileWatcher();
  child_process.spawnSync('rm', ['-rf', TEST_OUTPUT_DIR]);
});

describe('WatchedBundle', function() {
  it('is a function', function() {
    assert.isFunction(WatchedBundle);
  });
  it('inherits from Bundle', function() {
    assert.instanceOf(new WatchedBundle(), Bundle);
  });
  it('can compile a basic bundle', function(done) {
    var bundle = new WatchedBundle({
      config: {
        context: path.join(__dirname, 'test_bundles', 'basic_bundle'),
        entry: './entry.js',
        output: {
          path: TEST_OUTPUT_DIR,
          filename: 'output.js'
        }
      }
    });

    bundle.onceDone(function(err, stats) {
      assert.isNull(err);
      assert.isObject(stats);

      var existsAt = stats.compilation.assets['output.js'].existsAt;

      assert.isString(existsAt);
      fs.readFile(existsAt, function(err, contents) {
        assert.isNull(err);
        var compiledBundle = contents.toString();
        assert.include(compiledBundle, '__BASIC_BUNDLE_ENTRY_TEST__');
        assert.include(compiledBundle, '__BASIC_BUNDLE_REQUIRE_TEST__');
        done();
      });
    });
  });
  describe('#watchConfig', function() {
    it('can detect changes to a file', function(done) {
      var testFile = path.join(TEST_OUTPUT_DIR, 'watch_test', 'test.js');

      mkdirp.sync(path.dirname(testFile));

      var bundle = new WatchedBundle();

      fs.writeFile(testFile, 'test', function(err) {
        assert.isNull(err);
        assert.isUndefined(WatchedBundle._watchedFiles[testFile]);
        var changesDetected = 0;
        bundle.watchFile(testFile, function() {
          changesDetected++;
        });
        assert.isArray(WatchedBundle._watchedFiles[testFile]);
        assert.equal(WatchedBundle._watchedFiles[testFile].length, 1);
        assert.equal(changesDetected, 0);
        fs.writeFile(testFile, 'test 1', function(err) {
          assert.isNull(err);
          assert.equal(WatchedBundle._watchedFiles[testFile].length, 1);
          bundle.watchFile(testFile, _.once(function() {
            assert.equal(changesDetected, 1);
            bundle.watchFile(testFile, _.once(function() {
              assert.equal(changesDetected, 2);
              done();
            }));
            assert.equal(WatchedBundle._watchedFiles[testFile].length, 3);
            fs.writeFile(testFile, 'test 3', function (err) {
              assert.isNull(err);
            });
          }));
          assert.equal(WatchedBundle._watchedFiles[testFile].length, 2);
          fs.writeFile(testFile, 'test 2', function(err) {
            assert.isNull(err);
          });
        });
      });
    });
    it('can detect changes to the config file', function(done) {
      var opts = {
        config: path.join(TEST_OUTPUT_DIR, 'detect_changes_to_config_watch_test', 'webpack.config.js'),
        watchConfig: true
      };
      var bundle = new WatchedBundle(opts);

      var invalidatedConfigCount = 0;

      bundle.invalidateConfig = function() {
        invalidatedConfigCount++;
      };

      mkdirp.sync(path.dirname(opts.config));

      fs.writeFile(opts.config, '{}', function(err) {
        assert.isUndefined(WatchedBundle._watchedFiles[opts.config]);
        bundle.getConfig(function(err) {
          assert.isNull(err);
          assert.isArray(WatchedBundle._watchedFiles[opts.config]);
          assert.equal(WatchedBundle._watchedFiles[opts.config].length, 1);
          assert.equal(invalidatedConfigCount, 0);
          bundle.watchFile(opts.config, _.once(function() {
            assert.equal(invalidatedConfigCount, 1);
            assert.equal(WatchedBundle._watchedFiles[opts.config].length, 2);
            bundle.watchFile(opts.config, _.once(function() {
              assert.equal(invalidatedConfigCount, 2);
              done();
            }));
            assert.equal(WatchedBundle._watchedFiles[opts.config].length, 3);
            fs.writeFile(opts.config, '  {}', function(err) {
              assert.isNull(err);
            });
          }));
          assert.equal(WatchedBundle._watchedFiles[opts.config].length, 2);
          fs.writeFile(opts.config, ' {}', function(err) {
            assert.isNull(err);
          });
        });
      });
    });
    it('can detect changes to the config file and invalidate the config', function(done) {
      this.timeout(5000);

      var opts = {
        config: path.join(TEST_OUTPUT_DIR, 'invalidate_config_watch_test', 'webpack.config.js'),
        watchConfig: true
      };
      var bundle = new WatchedBundle(opts);

      mkdirp.sync(path.dirname(opts.config));

      fs.writeFile(opts.config, 'module.exports = {test:1};', function(err) {
        bundle.getConfig(function(err, config) {
          assert.isNull(err);
          assert.isObject(config);
          assert.strictEqual(bundle.config, config);
          assert.equal(config.test, 1);
          bundle.watchFile(opts.config, _.once(function() {
            assert.isNull(bundle.config);
            bundle.getConfig(function(err, config) {
              assert.isNull(err);
              assert.isObject(config);
              assert.strictEqual(bundle.config, config);
              assert.equal(config.test, 2);
              bundle.watchFile(opts.config, _.once(function() {
                assert.isNull(bundle.config);
                bundle.getConfig(function(err, config) {
                  assert.isNull(err);
                  assert.isObject(config);
                  assert.strictEqual(bundle.config, config);
                  assert.equal(config.test, 3);
                  done();
                });
              }));
              fs.writeFile(opts.config, 'module.exports = {test:3};', function(err) {
                assert.isNull(err);
              });
            });
          }));
          fs.writeFile(opts.config, 'module.exports = {test:2};', function(err) {
            assert.isNull(err);
          });
        });
      });
    });
    it('can detect changes to a config file and rebuild the bundle whenever the config has been invalidated', function(done) {
      this.timeout(5000);

      var opts = {
        config: path.join(TEST_OUTPUT_DIR, 'watch_config_to_invalidate_bundle', 'webpack.config.js'),
        watchConfig: true
      };
      var config_1 = {
        context: path.join(__dirname, 'test_bundles', 'watched_config_bundle'),
        entry: './entry_1.js',
        output: {
          path: path.join(TEST_OUTPUT_DIR, 'watched_config'),
          filename: 'output.js'
        }
      };
      var config_2 = _.defaults({
        entry: './entry_2.js'
      }, config_1);
      var config_3 = _.defaults({
        entry: './entry_3.js'
      }, config_2);

      var bundle = new WatchedBundle(opts);

      mkdirp.sync(path.dirname(opts.config));

      fs.writeFile(opts.config, 'module.exports = ' + JSON.stringify(config_1), function(err) {
        assert.isNull(err);
        bundle.onceDone(function(err, stats) {
          assert.isNull(err);
          assert.isObject(stats);
          var existsAt = stats.compilation.assets['output.js'].existsAt;
          assert.isString(existsAt);
          fs.readFile(existsAt, function(err, contents) {
            assert.isNull(err);
            var compiledBundle = contents.toString();
            assert.include(compiledBundle, '__WATCHED_CONFIG_ONE__');
            var prevStats = stats;
            bundle.watchFile(opts.config, _.once(function() {
              bundle.onceDone(function(err, stats) {
                assert.isAbove(stats.startTime, prevStats.startTime);
                var existsAt = stats.compilation.assets['output.js'].existsAt;
                assert.isString(existsAt);
                fs.readFile(existsAt, function(err, contents) {
                  assert.isNull(err);
                  var compiledBundle = contents.toString();
                  assert.include(compiledBundle, '__WATCHED_CONFIG_TWO__');
                  bundle.watchFile(opts.config, _.once(function() {
                    bundle.onceDone(function(err, stats) {
                      var existsAt = stats.compilation.assets['output.js'].existsAt;
                      assert.isString(existsAt);
                      fs.readFile(existsAt, function (err, contents) {
                        assert.isNull(err);
                        var compiledBundle = contents.toString();
                        assert.include(compiledBundle, '__WATCHED_CONFIG_THREE__');
                        done();
                      });
                    });
                  }));
                  fs.writeFile(opts.config, 'module.exports = ' + JSON.stringify(config_3), function(err) {
                    assert.isNull(err);
                  });
                });
              });
            }));
            fs.writeFile(opts.config, 'module.exports = ' + JSON.stringify(config_2), function(err) {
              assert.isNull(err);
            });
          });
        });
      });
    });
  });
  describe('#watchSource', function() {
    it('can detect changes to a file', function(done) {
      var testFile = path.join(TEST_OUTPUT_DIR, 'watch_source_change_detection', 'entry.js');
      var output = path.join(path.dirname(testFile), 'output.js');
      var opts = {
        config: {
          context: path.dirname(testFile),
          entry: './' + path.basename(testFile),
          output: {
            path: path.dirname(output),
            filename: path.basename(output)
          }
        },
        watchSource: true
      };
      var bundle = new WatchedBundle(opts);

      mkdirp.sync(path.dirname(testFile));

      var bundleInvalidatedCount = 0; // Offset to allow for the initial call from .compile
      bundle.invalidate = function() {
        bundleInvalidatedCount++;
        WatchedBundle.prototype.invalidate.call(this);
      };

      fs.writeFile(testFile, 'module.exports="__WATCH_SOURCE_ONE__";', function (err) {
        assert.isNull(err);
        bundle.onceDone(function(err, stats) {
          assert.isNull(err);
          assert.isObject(stats);
          fs.readFile(output, function(err, data) {
            assert.isNull(err);
            assert.include(data.toString(), '__WATCH_SOURCE_ONE__');
            assert.equal(bundleInvalidatedCount, 0);
            bundle.watchFile(testFile, _.once(function() {
              assert.equal(bundleInvalidatedCount, 1);
              fs.readFile(output, function (err, data) {
                assert.isNull(err);
                assert.include(data.toString(), '__WATCH_SOURCE_TWO__');
                bundle.watchFile(testFile, _.once(function() {
                  assert.equal(bundleInvalidatedCount, 2);
                  fs.readFile(output, function (err, data) {
                    assert.isNull(err);
                    assert.include(data.toString(), '__WATCH_SOURCE_THREE__');
                    done();
                  });
                }));
                fs.writeFile(testFile, 'module.exports="__WATCH_SOURCE_THREE__";', function (err) {
                  assert.isNull(err);
                });
              });
            }));
            fs.writeFile(testFile, 'module.exports="__WATCH_SOURCE_TWO__";', function (err) {
              assert.isNull(err);
            });
          });
        });
      });
    });
  });
});