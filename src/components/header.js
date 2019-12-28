import PropTypes from 'prop-types'
import React, { Fragment } from 'react'
import styles from './header.module.css'

const Header = props => {
  const { title, description, children } = props

  return (
    <header>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.description}>{description}</p>
      {children}
    </header>
  )
}

Header.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  children: PropTypes.node.isRequired,
}

export default Header