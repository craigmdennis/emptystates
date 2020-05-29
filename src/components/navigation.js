import React from 'react';
import { Link } from 'gatsby';
import Container from './container';
import Logo from './logo';
import styles from '../styles/navigation.module.css';

const navigationItems = [
  {
    anchorText: 'Latest',
    path: '/',
  },
  {
    anchorText: 'Mobile',
    path: '/tags/mobile/',
  },
  {
    anchorText: 'Desktop',
    path: '/tags/desktop/',
  },
  {
    anchorText: 'iOS',
    path: '/tags/iso/',
  },
  {
    anchorText: 'Android',
    path: '/tags/android/',
  },
  {
    anchorText: 'Errors',
    path: '/tags/error/',
  },
];

// To Do: Provide an array and loop through it
export default () => (
  <nav role="navigation">
    <div className={styles.bar}>
      <Container>
        <div className={styles.navigation}>
          <Logo />
          <ul className={styles.menu}>
            {navigationItems.map((item, index) => {
              return (
                <li className={styles.item} key={index}>
                  <Link
                    activeClassName={styles.active}
                    className={styles.link}
                    to={item.path}
                  >
                    {item.anchorText}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </Container>
    </div>
  </nav>
);
