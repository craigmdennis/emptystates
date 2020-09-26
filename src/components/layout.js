import PropTypes from 'prop-types';
import React, { Fragment, useState } from 'react';
import Container from './container';
import Navigation from './navigation';
import styles from '../styles/layout.module.css';

const Layout = ({ children }) => {
  const [menuState, setMenuState] = useState('closed');
  const toggleMenu = () => {
    menuState === 'closed' ? setMenuState('open') : setMenuState('closed');
  };
  return (
    <Fragment>
      <Navigation onHamburgerClick={toggleMenu} state={menuState} />
      <div className={styles.spacing}>
        <Container>{children}</Container>
      </div>
    </Fragment>
  );
};

export default Layout;

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};
