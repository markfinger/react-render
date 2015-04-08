var fs = require('fs');
var path = require('path');
var child_process = require('child_process');
var _ = require('lodash');
var mkdirp = require('mkdirp');
var assert = require('chai').assert;
var Bundle = require('../lib/Bundle');

var TEST_OUTPUT_DIR = path.join(__dirname, 'bundle_test_output');

describe('Bundle', function() {
  // Ensure we have a clean slate before and after each test
  beforeEach(function() {
    Bundle._resetFileWatcher();
    child_process.spawnSync('rm', ['-rf', TEST_OUTPUT_DIR]);
  });
  afterEach(function() {
    Bundle._resetFileWatcher();
    child_process.spawnSync('rm', ['-rf', TEST_OUTPUT_DIR]);
  });

  it('is a function', function() {
    assert.isFunction(Bundle);
  });
  it('can accept an options argument', function(done) {
    var opts = {
      config: require('./test_bundles/basic_bundle/webpack.config')
    };
    var bundle = new Bundle(opts);
    assert.strictEqual(bundle.opts, opts);
    bundle.getConfig(function(err, config) {
      assert.isNull(err);
      assert.strictEqual(config, require('./test_bundles/basic_bundle/webpack.config'));
      done();
    });
  });
  it('can accept a string as a config option and the file will be required', function(done) {
    var bundle = new Bundle({
      config: path.join(__dirname, 'test_bundles', 'basic_bundle', 'webpack.config.js')
    });
    bundle.getConfig(function(err, config) {
      assert.isNull(err);
      assert.strictEqual(config, require('./test_bundles/basic_bundle/webpack.config'));
      done();
    });
  });
  it('can compile a basic bundle', function(done) {
    var bundle = new Bundle({
      config: require('./test_bundles/basic_bundle/webpack.config')
    });

    bundle.compile(function(err, stats) {
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
  it('tracks compilation state', function(done) {
    var bundle = new Bundle({
      config: require('./test_bundles/basic_bundle/webpack.config')
    });

    assert.isFalse(bundle.isCompiling);
    assert.isFalse(bundle.hasCompiled);
    assert.isNull(bundle.compiler);

    bundle.compile(function(err, stats) {
      assert.isFalse(bundle.isCompiling);
      assert.isTrue(bundle.hasCompiled);
      assert.isObject(bundle.compiler);

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

    assert.isTrue(bundle.isCompiling);
    assert.isFalse(bundle.hasCompiled);
  });
  it('records the output of the last compilation', function(done) {
    var bundle = new Bundle({
      config: require('./test_bundles/basic_bundle/webpack.config')
    });

    assert.isNull(bundle.err);
    assert.isNull(bundle.stats);

    bundle.compile(function(err, stats) {
      assert.isNull(bundle.err);
      assert.isObject(bundle.stats);
      assert.strictEqual(err, bundle.err);
      assert.strictEqual(stats, bundle.stats);

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

    assert.isNull(bundle.err);
    assert.isNull(bundle.stats);
  });
  it('can defer concurrent compilation requests until done', function(done) {
    var bundle = new Bundle({
      config: require('./test_bundles/basic_bundle/webpack.config')
    });

    assert.isFalse(bundle.isCompiling);
    assert.isFalse(bundle.hasCompiled);
    assert.isNull(bundle.compiler);
    assert.isArray(bundle._onceDone);
    assert.equal(bundle._onceDone.length, 0);

    var cb1 = function(err, stats) {
      assert.isFalse(bundle.isCompiling);
      assert.isTrue(bundle.hasCompiled);
      assert.isObject(bundle.compiler);
      assert.equal(bundle._onceDone.length, 0);
      assert.strictEqual(err, bundle.err);
      assert.strictEqual(stats, bundle.stats);
    };

    bundle.onceDone(cb1);
    assert.isTrue(bundle.isCompiling);
    assert.isFalse(bundle.hasCompiled);
    assert.equal(bundle._onceDone.length, 1);
    assert.strictEqual(bundle._onceDone[0], cb1);

    var cb2 = function(err, stats) {
      assert.isFalse(bundle.isCompiling);
      assert.isTrue(bundle.hasCompiled);
      assert.isObject(bundle.compiler);
      assert.equal(bundle._onceDone.length, 0);
      assert.strictEqual(err, bundle.err);
      assert.strictEqual(stats, bundle.stats);

      done();
    };

    bundle.onceDone(cb2);
    assert.isTrue(bundle.isCompiling);
    assert.isFalse(bundle.hasCompiled);
    assert.equal(bundle._onceDone.length, 2);
    assert.strictEqual(bundle._onceDone[0], cb1);
    assert.strictEqual(bundle._onceDone[1], cb2);
  });
  it('can cache compilation output', function(done) {
    var bundle = new Bundle({
      config: require('./test_bundles/basic_bundle/webpack.config')
    });

    bundle.onceDone(function(err, stats) {
      assert.isNull(err);
      assert.isObject(stats);

      bundle.onceDone(function(_err, _stats) {
        assert.strictEqual(err, _err);
        assert.strictEqual(stats, _stats);

        bundle.onceDone(function(__err, __stats) {
          assert.strictEqual(_err, __err);
          assert.strictEqual(_stats, __stats);

          done();
        });
      });
    });
  });
  it('can invalidate cached compilation output', function(done) {
    var bundle = new Bundle({
      config: require('./test_bundles/basic_bundle/webpack.config')
    });

    bundle.onceDone(function(err, stats) {
      assert.isNull(err);
      assert.isObject(stats);

      assert.isObject(bundle.compiler);

      bundle.invalidate();

      assert.isObject(bundle.compiler);

      bundle.onceDone(function(_err, _stats) {
        assert.isNull(_err);
        assert.notStrictEqual(stats, _stats);
        assert.isObject(_stats);

        bundle.onceDone(function(__err, __stats) {
          assert.strictEqual(_err, __err);
          assert.strictEqual(_stats, __stats);

          done();
        });
      });
    });
  });
  describe('#watchConfig', function() {
    it('can detect changes to a file', function(done) {
      var testFile = path.join(TEST_OUTPUT_DIR, 'watch_test', 'test.js');

      mkdirp.sync(path.dirname(testFile));

      var bundle = new Bundle();

      fs.writeFile(testFile, 'test', function(err) {
        assert.isNull(err);
        assert.isUndefined(Bundle._watchedFiles[testFile]);
        var changesDetected = 0;
        bundle.watchFile(testFile, function() {
          changesDetected++;
        });
        assert.isArray(Bundle._watchedFiles[testFile]);
        assert.equal(Bundle._watchedFiles[testFile].length, 1);
        assert.equal(changesDetected, 0);
        fs.writeFile(testFile, 'test 1', function(err) {
          assert.isNull(err);
          assert.equal(Bundle._watchedFiles[testFile].length, 1);
          bundle.watchFile(testFile, _.once(function() {
            assert.equal(changesDetected, 1);
            bundle.watchFile(testFile, _.once(function() {
              assert.equal(changesDetected, 2);
              done();
            }));
            assert.equal(Bundle._watchedFiles[testFile].length, 3);
            fs.writeFile(testFile, 'test 3', function (err) {
              assert.isNull(err);
            });
          }));
          assert.equal(Bundle._watchedFiles[testFile].length, 2);
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
      var bundle = new Bundle(opts);

      var invalidatedConfigCount = 0;

      bundle.invalidateConfig = function() {
        invalidatedConfigCount++;
      };

      mkdirp.sync(path.dirname(opts.config));

      fs.writeFile(opts.config, '{}', function(err) {
        assert.isUndefined(Bundle._watchedFiles[opts.config]);
        bundle.getConfig(function(err) {
          assert.isNull(err);
          assert.isArray(Bundle._watchedFiles[opts.config]);
          assert.equal(Bundle._watchedFiles[opts.config].length, 1);
          assert.equal(invalidatedConfigCount, 0);
          bundle.watchFile(opts.config, _.once(function() {
            assert.equal(invalidatedConfigCount, 1);
            assert.equal(Bundle._watchedFiles[opts.config].length, 2);
            bundle.watchFile(opts.config, _.once(function() {
              assert.equal(invalidatedConfigCount, 2);
              done();
            }));
            assert.equal(Bundle._watchedFiles[opts.config].length, 3);
            fs.writeFile(opts.config, '  {}', function(err) {
              assert.isNull(err);
            });
          }));
          assert.equal(Bundle._watchedFiles[opts.config].length, 2);
          fs.writeFile(opts.config, ' {}', function(err) {
            assert.isNull(err);
          });
        });
      });
    });
    it('can detect changes to the config file and invalidate the config', function(done) {
      var opts = {
        config: path.join(TEST_OUTPUT_DIR, 'invalidate_config_watch_test', 'webpack.config.js'),
        watchConfig: true
      };
      var bundle = new Bundle(opts);

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

      var bundle = new Bundle(opts);

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
});