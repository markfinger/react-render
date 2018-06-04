var React = require('react');
var createReactClass = require('create-react-class');

var Hello = createReactClass({
  render: function() {
    return React.createElement("div", null, "Hello ", this.props.name);
  }
});

module.exports = Hello;
