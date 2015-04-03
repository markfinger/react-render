var path = require('path');
var assert = require('chai').assert;
var reactRender = require('..');
var components = require('../lib/components');
var Component = require('../lib/Component');
var Hello = require('./test_components/Hello');

describe('reactRender', function() {
  beforeEach(function() {
    components.clear();
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
      assert.isUndefined(output);
      done();
    });
  });
  it('should create `Component` instances when called', function(done) {
    assert.isArray(components._components);
    assert.equal(components._components.length, 0);

    reactRender({
      component: Hello
    }, function() {
      assert.equal(components._components.length, 1);
      assert.instanceOf(components._components[0], Component);
      assert.equal(components._components[0].component, Hello);
      done();
    });
  });
  it('should reuse Component instances when called', function(done) {
    assert.isArray(components._components);
    assert.equal(components._components.length, 0);

    reactRender({
      component: Hello
    }, function() {
      assert.equal(components._components.length, 1);
      assert.instanceOf(components._components[0], Component);
      assert.equal(components._components[0].component, Hello);

      reactRender({
        component: Hello
      }, function() {
        assert.equal(components._components.length, 1);
        assert.instanceOf(components._components[0], Component);
        assert.equal(components._components[0].component, Hello);
        done();
      });
    });
  });
});