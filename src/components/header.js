import PropTypes from 'prop-types';
import React from 'react';
import * as styles from '../styles/header.module.css';

const Header = ({ title, description, children, large = false }) => {
  const sizeClass = large ? styles.title : styles.subtitle;

  return (
    <header className={styles.header}>
      {title && <h1 className={sizeClass}>{title}</h1>}
      {description && <p className={styles.description}>{description}</p>}
      {children}
    </header>
  );
};

Header.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  children: PropTypes.any,
  large: PropTypes.bool,
};

export default Header;
