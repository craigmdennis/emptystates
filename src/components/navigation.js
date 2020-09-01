import React from 'react';
import { Link } from 'gatsby';
import Container from './container';
import Logo from './logo';
import Search from './search';
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
    path: '/tags/ios/',
  },
  {
    anchorText: 'Android',
    path: '/tags/android/',
  },
];

// To Do: Provide an array and loop through it
const Navigation = () => (
  <nav role="navigation">
    <div className={styles.bar}>
      <Container>
        <div className={styles.navigation}>
          <Logo />
          <ul className={`${styles.menu} flex-1`}>
            {navigationItems.map((item, index) => {
              return (
                <li className={styles.bullet} key={index}>
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
          <div className={`${styles.item} flex-1`}>
            <Search />
          </div>
          <div className={`${styles.item} ml-8`}>
            <Link
              to={'/submit/'}
              className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
            >
              Submit Your Own
            </Link>
          </div>
        </div>
      </Container>
    </div>
  </nav>
);

export default Navigation;
