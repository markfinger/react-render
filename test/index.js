var path = require('path');
var assert = require('chai').assert;
var reactRender = require('..');
var cache = require('../lib/cache');
var Component = require('../lib/Component');
var Hello = require('./test_components/Hello');
var ErrorThrowingComponent = require('./test_components/ErrorThrowingComponent');

describe('reactRender', function() {
  beforeEach(function() {
    cache.clear();
  });
  it('is a function', function() {
    assert.isFunction(reactRender);
  });
  it('can render a component to static markup', function(done) {
    reactRender({
      component: Hello,
      toStaticMarkup: true,
      props: {
        name: 'World'
      }
    }, function(err, output) {
      assert.isNull(err);
      assert.equal(output, '<div>Hello World</div>');
      done();
    });
  });
  it('can render a component to a string', function(done) {
    reactRender({
      component: Hello,
      props: {
        name: 'World'
      }
    }, function(err, output) {
      assert.isNull(err);
      assert.include(output, '<div');
      assert.include(output, '><span');
      assert.include(output, '>Hello </span><span');
      assert.include(output, '>World</span>');
      assert.include(output, '</div>');
      done();
    });
  });
  it('can render a component without props', function(done) {
    reactRender({
      component: Hello,
      toStaticMarkup: true
    }, function(err, output) {
      assert.isNull(err);
      assert.equal(output, '<div>Hello </div>');
      done();
    });
  });
  it('can parse props which are provided in a JSON serialized form', function(done) {
    reactRender({
      component: Hello,
      toStaticMarkup: true,
      serializedProps: '{"name": "World"}'
    }, function(err, output) {
      assert.isNull(err);
      assert.equal(output, '<div>Hello World</div>');
      done();
    });
  });
  it('can require a component specified by a path and render it', function(done) {
    reactRender({
      path: path.join(__dirname, 'test_components', 'Hello'),
      toStaticMarkup: true,
      props: {
        name: 'World'
      }
    }, function(err, output) {
      assert.isNull(err);
      assert.equal(output, '<div>Hello World</div>');
      done();
    });
  });
  it('should return an error if neither `component` and `path` have been defined', function(done) {
    reactRender({
      toStaticMarkup: true,
      props: {
        name: 'World'
      }
    }, function(err, output) {
      assert.instanceOf(err, Error);
      assert.include(err.stack, 'Component missing `path` and `component` properties');
      assert.isUndefined(output);
      done();
    });
  });
  it('should create `Component` instances when called', function(done) {
    assert.isArray(cache._cache);
    assert.equal(cache._cache.length, 0);

    reactRender({
      component: Hello
    }, function() {
      assert.equal(cache._cache.length, 1);
      assert.instanceOf(cache._cache[0], Component);
      assert.equal(cache._cache[0].component, Hello);
      done();
    });
  });
  it('should reuse Component instances when called', function(done) {
    assert.isArray(cache._cache);
    assert.equal(cache._cache.length, 0);

    reactRender({
      component: Hello
    }, function() {
      assert.equal(cache._cache.length, 1);
      assert.instanceOf(cache._cache[0], Component);
      assert.equal(cache._cache[0].component, Hello);

      reactRender({
        component: Hello
      }, function() {
        assert.equal(cache._cache.length, 1);
        assert.instanceOf(cache._cache[0], Component);
        assert.equal(cache._cache[0].component, Hello);

        reactRender({
          component: Hello
        }, function() {
          assert.equal(cache._cache.length, 1);
          assert.instanceOf(cache._cache[0], Component);
          assert.equal(cache._cache[0].component, Hello);
          done();
        });
      });
    });
  });
  it('passes up errors thrown during a component\'s rendering', function(done) {
    reactRender({
      component: ErrorThrowingComponent
    }, function(err, output) {
      assert.instanceOf(err, Error);
      assert.include(err.stack, 'Error from inside ErrorThrowingComponent');
      assert.include(err.stack, path.join(__dirname, 'test_components', 'ErrorThrowingComponent.js'));
      assert.isUndefined(output);
      done();
    });
  });
  //it('can transform a component using JSX', function(done) {
  //  reactRender({
  //    path: path.join(__dirname, 'test_components', 'Hello.jsx'),
  //    props: {
  //      name: 'World'
  //    },
  //    transform: true,
  //    toStaticMarkup: true
  //  }, function(err, output) {
  //    assert.isNull(err);
  //    assert.equal(output, '<div>Hello World</div>');
  //    done();
  //  });
  //});
  //it('should map stack traces for transformed components back to the original file', function(done) {
  //  reactRender({
  //    path: path.join(__dirname, 'test_components', 'RunTimeError.jsx'),
  //    transform: true
  //  }, function(err, output) {
  //    assert.isNotNull(err);
  //    assert.include(err.stack, path.join(__dirname, 'test_components', 'RunTimeError.jsx'));
  //    assert.isUndefined(output);
  //    done();
  //  });
  //});
});