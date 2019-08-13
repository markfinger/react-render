const React = require('react');

class ErrorThrowingComponent extends React.Component{
  render() {
    throw Error('Error from inside ErrorThrowingComponent');
  }
}

module.exports = ErrorThrowingComponent;
