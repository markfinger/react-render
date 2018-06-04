var React = require('react');
var createReactClass = require('create-react-class');

var SyntaxErrorComponent = createReactClass({
  render: function() {
    ?+
  }
});

module.exports = SyntaxErrorComponent;
