var React = require('react');
var createReactClass = require('create-react-class');

var Hello = createReactClass({
  render: function() {
    return <div>Hello {this.props.name}</div>;
  }
});

// Trigger a runtime error
foo += 1;

module.exports = Hello;
