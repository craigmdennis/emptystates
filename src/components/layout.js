import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import Container from './Container';
import Navigation from './Navigation';
import styles from '../styles/layout.module.css';

const Layout = ({ children }) => {
  return (
    <Fragment>
      <Navigation />
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
