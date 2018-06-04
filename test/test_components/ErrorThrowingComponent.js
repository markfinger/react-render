var React = require('react');
var createReactClass = require('create-react-class');

var ErrorThrowingComponent = createReactClass({
  render: function() {
    throw Error('Error from inside ErrorThrowingComponent');
  }
});

module.exports = ErrorThrowingComponent;
