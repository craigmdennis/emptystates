import React from 'react';
import { graphql, Link, useStaticQuery } from 'gatsby';
import styles from '../styles/logo.module.css';
import LogoImg from '../images/logo.svg';

const Logo = () => {
  const data = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          title
        }
      }
    }
  `);

  return (
    <Link className={styles.logo} to="/">
      <LogoImg className={styles.svg} />
      <span className={styles.name}>{data.site.siteMetadata.title}</span>
    </Link>
  );
};

export default Logo;
