import PropTypes from "prop-types";
import React, { Fragment } from "react";
import styles from "./header.module.css";

const Header = data => {
  const { title, description, children } = data;

  return (
    <header>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.description}>{description}</p>
      {children}
    </header>
  );
};

Header.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  children: PropTypes.node,
};

export default Header;
