import PropTypes from 'prop-types';
import React, { Fragment, useState } from 'react';
import Container from './container';
import Navigation from './navigation';

const Layout = ({ children }) => {
  const [menuState, setMenuState] = useState('closed');
  const toggleMenu = () => {
    menuState === 'closed' ? setMenuState('open') : setMenuState('closed');
  };
  return (
    <Fragment>
      <Navigation onHamburgerClick={toggleMenu} state={menuState} />
      <Container>{children}</Container>
    </Fragment>
  );
};

export default Layout;

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};
