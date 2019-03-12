import React, { Fragment } from 'react'
import styles from './header.module.css'

class Header extends React.Component {
  render() {
    const { title, description, children } = this.props

    return (
      <Fragment>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
        {children}
      </Fragment>
    )
  }
}

export default Header
