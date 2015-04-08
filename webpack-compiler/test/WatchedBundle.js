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
  Bundle._resetFileWatcher();
  child_process.spawnSync('rm', ['-rf', TEST_OUTPUT_DIR]);
});

afterEach(function() {
  Bundle._resetFileWatcher();
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
  //describe('#watchSource', function() {
  //  it('can detect changes to a file', function(done) {
  //    var testFile = path.join(TEST_OUTPUT_DIR, 'watch_source_change_detection', 'entry.js');
  //    var output = path.join(path.dirname(testFile), 'output.js');
  //    var opts = {
  //      config: {
  //        context: path.dirname(testFile),
  //        entry: './' + path.basename(testFile),
  //        output: {
  //          path: path.dirname(output),
  //          filename: path.basename(output)
  //        }
  //      },
  //      watchSource: true
  //    };
  //    var bundle = new WatchedBundle(opts);
  //
  //    mkdirp.sync(path.dirname(testFile));
  //
  //    var bundleInvalidatedCount = 0; // Offset to allow for the initial call from .compile
  //    bundle.invalidate = function() {
  //      bundleInvalidatedCount++;
  //      WatchedBundle.prototype.invalidate.call(this);
  //    };
  //
  //    fs.writeFile(testFile, 'module.exports="__WATCH_SOURCE_ONE__";', function (err) {
  //      assert.isNull(err);
  //      bundle.onceDone(function(err, stats) {
  //        assert.isNull(err);
  //        assert.isObject(stats);
  //        fs.readFile(output, function(err, data) {
  //          assert.isNull(err);
  //          assert.include(data.toString(), '__WATCH_SOURCE_ONE__');
  //          assert.equal(bundleInvalidatedCount, 0);
  //          bundle.watchFile(testFile, _.once(function() {
  //            assert.equal(bundleInvalidatedCount, 1);
  //            fs.readFile(output, function (err, data) {
  //              assert.isNull(err);
  //              assert.include(data.toString(), '__WATCH_SOURCE_TWO__');
  //              bundle.watchFile(testFile, _.once(function() {
  //                assert.equal(bundleInvalidatedCount, 2);
  //                fs.readFile(output, function (err, data) {
  //                  assert.isNull(err);
  //                  assert.include(data.toString(), '__WATCH_SOURCE_THREE__');
  //                  done();
  //                });
  //              }));
  //              fs.writeFile(testFile, 'module.exports="__WATCH_SOURCE_THREE__";', function (err) {
  //                assert.isNull(err);
  //              });
  //            });
  //          }));
  //          fs.writeFile(testFile, 'module.exports="__WATCH_SOURCE_TWO__";', function (err) {
  //            assert.isNull(err);
  //          });
  //        });
  //      });
  //    });
  //  });
  //});
});