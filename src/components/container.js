import React from 'react';

const Container = ({ children }) => (
  <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1rem' }}>
    {children}
  </div>
);

export default Container;
