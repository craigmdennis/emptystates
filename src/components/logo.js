import React from 'react'
import { Link } from 'gatsby'
import styles from './logo.module.css'
import LogoImg from '../images/logo.svg'

export default () => (
  <Link className={styles.logo} to="/">
    <LogoImg className={styles.svg} />
    <span className={styles.name}>Empty States</span>
  </Link>
)
