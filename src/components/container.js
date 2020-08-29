import React from 'react';
import PropTypes from 'prop-types';

const Container = ({ children }) => (
  <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1rem' }}>
    {children}
  </div>
);

export default Container;

Container.propTypes = {
  children: PropTypes.node,
};
