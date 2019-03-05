import React from 'react'
import { Link } from 'gatsby'
import styles from './navigation.module.css'

export default () => (
  <nav role="navigation">
    <ul className={styles.navigation}>
      <li className={styles.navigation__item}>
        <Link to="/">Home</Link>
      </li>
      <li className={styles.navigation__item}>
        <Link to="/tags/mobile/">Mobile</Link>
      </li>
      <li className={styles.navigation__item}>
        <Link to="/tags/tablet/">Tablet</Link>
      </li>
      <li className={styles.navigation__item}>
        <Link to="/tags/desktop/">Desktop</Link>
      </li>
      <li className={styles.navigation__item}>
        <Link to="/tags/games-console/">Games Console</Link>
      </li>
      <li className={styles.navigation__item}>
        <Link to="/tags/android/">Android</Link>
      </li>
      <li className={styles.navigation__item}>
        <Link to="/tags/ios/">iOS</Link>
      </li>
    </ul>
  </nav>
)
