import React from 'react'
import { Link } from 'gatsby'
import Container from './container'
import Logo from './logo'
import styles from './navigation.module.css'

export default () => (
  <nav role="navigation">
    <div className={styles.bar}>
      <Container>
        <div className={styles.navigation}>
          <Logo />
          <ul className={styles.menu}>
            <li className={styles.item}>
              <Link
                activeClassName={styles.active}
                className={styles.link}
                to="/"
              >
                Latest
              </Link>
            </li>
            <li className={styles.item}>
              <Link
                activeClassName={styles.active}
                className={styles.link}
                to="/tags/mobile/"
              >
                Mobile
              </Link>
            </li>
            <li className={styles.item}>
              <Link
                activeClassName={styles.active}
                className={styles.link}
                to="/tags/desktop/"
              >
                Desktop
              </Link>
            </li>
            <li className={styles.item}>
              <Link
                activeClassName={styles.active}
                className={styles.link}
                to="/tags/android/"
              >
                Android
              </Link>
            </li>
            <li className={styles.item}>
              <Link
                activeClassName={styles.active}
                className={styles.link}
                to="/tags/ios/"
              >
                iOS
              </Link>
            </li>
            <li className={styles.item}>
              <Link
                activeClassName={styles.active}
                className={styles.link}
                to="/tags/error/"
              >
                Errors
              </Link>
            </li>
          </ul>
        </div>
      </Container>
    </div>
  </nav>
)
