import PropTypes from 'prop-types'
import React, { Fragment } from 'react'
import Container from './container'
import Navigation from './navigation'

const Layout = ({ children }) => {
  return (
    <Fragment>
      <Navigation />
      <Container>{children}</Container>
    </Fragment>
  )
}


Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Layout
