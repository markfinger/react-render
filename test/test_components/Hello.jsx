var React = require('react');
var createReactClass = require('create-react-class');

var Hello = createReactClass({
  render: function() {
    return <div>Hello {this.props.name}</div>;
  }
});

module.exports = Hello;
