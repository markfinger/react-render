var path = require('path');
var assert = require('chai').assert;
var Component = require('../lib/Component');
var Hello = require('./test_components/Hello');
var ErrorThrowingComponent = require('./test_components/ErrorThrowingComponent');

describe('Component', function() {
  it('is a function', function() {
    assert.isFunction(Component);
  });
  it('can accept a component in its options', function(done) {
    var component = new Component({
      component: Hello
    });

    component.getComponent(function(err, component) {
      assert.isNull(err);
      assert.strictEqual(component, Hello);
      done();
    });
  });
  it('can require a component specified by a path', function(done) {
    var component = new Component({
      path: path.join(__dirname, 'test_components', 'Hello')
    });

    component.getComponent(function(err, component) {
      assert.isNull(err);
      assert.strictEqual(component, Hello);
      done();
    });
  });
  it('can render a component to static markup', function(done) {
    var component = new Component({
      component: Hello
    });

    component.renderToStaticMarkup(function(err, markup) {
      assert.isNull(err);
      assert.equal(markup, '<div>Hello </div>');
      done();
    });
  });
  it('can render a component to a string', function(done) {
    var component = new Component({
      component: Hello
    });

    component.renderToString(function(err, markup) {
      assert.isNull(err);
      assert.include(markup, '<div');
      assert.include(markup, '><span');
      assert.include(markup, '>Hello </span></div>');
      done();
    });
  });
  it('can render a component to static markup with props', function(done) {
    var component = new Component({
      component: Hello
    });

    component.renderToStaticMarkup({
      name: 'World'
    }, function(err, markup) {
      assert.isNull(err);
      assert.equal(markup, '<div>Hello World</div>');
      done();
    });
  });
  it('can render a component to a string with props', function(done) {
    var component = new Component({
      component: Hello
    });

    component.renderToString({
      name: 'World'
    }, function(err, markup) {
      assert.isNull(err);
      assert.include(markup, '<div');
      assert.include(markup, '><span');
      assert.include(markup, '>Hello </span><span');
      assert.include(markup, '>World</span>');
      assert.include(markup, '</div>');
      done();
    });
  });
  it('should return an error if neither `component` and `path` have been defined', function(done) {
    var component = new Component({});

    component.getComponent(function(err, component) {
      assert.instanceOf(err, Error);
      assert.include(err.stack, 'Component missing `path` and `component` properties');
      assert.isUndefined(component);
      done();
    });
  });
  it('passes up errors thrown during a component\'s rendering', function(done) {
    var component = new Component({
      component: ErrorThrowingComponent
    });

    component.renderToString(function(err, output) {
      assert.instanceOf(err, Error);
      assert.include(err.stack, 'Error from inside ErrorThrowingComponent');
      assert.include(err.stack, path.join(__dirname, 'test_components', 'ErrorThrowingComponent.js'));
      assert.isUndefined(output);
      done();
    });
  });
  it('provides a SyntaxError if a component contains syntax errors', function(done) {
    var component = new Component({
      path: path.join(__dirname, 'test_components', 'SyntaxErrorComponent.js')
    });

    component.getComponent(function(err, component) {
      assert.instanceOf(err, SyntaxError);
      assert.include(err.stack, path.join(__dirname, 'test_components', 'SyntaxErrorComponent.js'));
      assert.isUndefined(component);
      done();
    });
  });
});