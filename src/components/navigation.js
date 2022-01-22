import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'gatsby';

import HamburgerIcon from '../images/icon-menu.svg';
import CloseIcon from '../images/icon-close.svg';
import Container from './container';
import Logo from './logo';
import * as styles from '../styles/navigation.module.css';

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
const Navigation = ({ onHamburgerClick, state }) => {
  const clickedEvent = state === 'open' ? onHamburgerClick : null;
  return (
    <nav role="navigation">
      <div className={styles.bar}>
        <Container>
          <div className={styles.navigation}>
            <div onClick={clickedEvent} className={styles.logo}>
              <Logo />
            </div>
            <button onClick={onHamburgerClick} className={styles.hamburger}>
              {state === 'closed' && <HamburgerIcon className={styles.icon} />}
              {state === 'open' && <CloseIcon className={styles.icon} />}
            </button>
            <ul
              className={state === 'open' ? styles.menuopen : styles.menuclosed}
            >
              {navigationItems.map((item, index) => {
                return (
                  <li className={styles.item} key={index}>
                    <Link
                      activeClassName={styles.active}
                      className={styles.link}
                      partiallyActive={item.path !== '/'}
                      to={item.path}
                      onClick={clickedEvent}
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
};

export default Navigation;

Navigation.propTypes = {
  onHamburgerClick: PropTypes.func,
  state: PropTypes.oneOf(['open', 'closed']),
};

Navigation.defaultProps = {
  state: 'closed',
};
