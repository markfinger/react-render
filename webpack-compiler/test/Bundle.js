var fs = require('fs');
var path = require('path');
var child_process = require('child_process');
var assert = require('chai').assert;
var Bundle = require('../lib/Bundle');

var TEST_OUTPUT_DIR = path.join(__dirname, 'bundle_test_output');

describe('Bundle', function() {
  // Ensure we have a clean slate before and after each test
  beforeEach(function() {
    child_process.spawnSync('rm', ['-rf', TEST_OUTPUT_DIR]);
  });
  afterEach(function() {
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
});