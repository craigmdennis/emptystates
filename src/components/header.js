import React, { Fragment } from 'react'
import styles from './header.module.css'

const Header = props => {
  const { title, description, children } = props

  return (
    <Fragment>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.description}>{description}</p>
      {children}
    </Fragment>
  )
}

export default Header
