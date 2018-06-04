var React = require('react');
var createReactClass = require('create-react-class');
var Hello = require('./Hello.jsx');

var HelloWrapper = createReactClass({
  render: function () {
    var numbers = this.props.numbers.map(function (number) {
      return number * 10;
    }).join(', ');
    return (
      <div>
        <Hello name={this.props.name} />
        <span>{numbers}</span>
      </div>
    );
  }
});

module.exports = HelloWrapper;
