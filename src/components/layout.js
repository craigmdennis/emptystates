import React, { Fragment } from 'react'
import './base.css'
import Container from './container'
import Navigation from './navigation'

class Template extends React.Component {
  render() {
    const { children } = this.props

    let rootPath = `/`
    if (typeof __PREFIX_PATHS__ !== `undefined` && __PREFIX_PATHS__) {
      rootPath = __PATH_PREFIX__ + `/`
    }

    return (
      <Fragment>
        <Navigation />
        <Container>{children}</Container>
      </Fragment>
    )
  }
}

export default Template
