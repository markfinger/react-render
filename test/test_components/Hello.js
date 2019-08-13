const React = require('react');

class Hello extends React.Component {
  render() {
    return React.createElement("div", null, "Hello ", this.props.name);
  }
}

module.exports = Hello;
