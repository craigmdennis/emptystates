import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import Container from './Container';
import Navigation from './Navigation';

const Layout = ({ children }) => {
  return (
    <Fragment>
      <Navigation />
      <Container>{children}</Container>
    </Fragment>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
