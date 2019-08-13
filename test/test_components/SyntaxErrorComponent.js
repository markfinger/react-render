const React = require('react');

class SyntaxErrorComponent extends React.Component{
  render: function() {
    ?+
  }
}

module.exports = SyntaxErrorComponent;
