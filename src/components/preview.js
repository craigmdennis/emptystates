import React from 'react';
import { Link } from 'gatsby';
import Img from 'gatsby-image';
import styles from '../styles/preview.module.css';

const Preview = ({ path, image }) => {
  return (
    <Link to={path}>
      <Img
        loading="lazy"
        className={styles.item}
        key={image.id}
        fluid={image.childImageSharp.fluid}
      />
    </Link>
  );
};

export default Preview;
