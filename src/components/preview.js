import React from 'react';
import { Link } from 'gatsby';
import Img from 'gatsby-image';
import styles from '../styles/preview.module.css';

const Preview = ({ title, path, image: { id, childImageSharp } }) => {
  return (
    <Link to={path}>
      <Img
        alt={`Screenshot showing ${title}`}
        loading="lazy"
        className={styles.item}
        key={id}
        fluid={childImageSharp.fluid}
      />
      <span className="visually-hidden">{title}</span>
    </Link>
  );
};

export default Preview;
