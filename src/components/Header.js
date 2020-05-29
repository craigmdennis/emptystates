import PropTypes from 'prop-types';
import React from 'react';
import styles from '../styles/header.module.css';

const Header = (props) => {
  const { title, description, children, large } = props;
  const sizeClass = large ? styles.title : styles.subtitle;

  return (
    <header>
      {title && <h1 className={sizeClass}>{title}</h1>}
      {description && <p className={styles.description}>{description}</p>}
      {children}
    </header>
  );
};

Header.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  children: PropTypes.node,
  large: PropTypes.bool,
};

Header.defaultProps = {
  large: false,
};

export default Header;
