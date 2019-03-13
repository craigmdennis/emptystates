import React, { Fragment } from 'react'
import Container from './container'
import Navigation from './navigation'

import './base.css'

const Template = ({ children }) => {
  return (
    <Fragment>
      <Navigation />
      <Container>{children}</Container>
    </Fragment>
  )
}

export default Template
