import React from 'react';

class Hello extends React.Component {
  render() {
    return <h1 glorious-test >Hello</h1>
  }
}

React.render(<Hello/>, document.getElementById('hello'));
