import React from 'react';
import { Link } from 'gatsby';
import Img from 'gatsby-image';
import PropTypes from 'prop-types';

import styles from '../styles/preview.module.css';

const Preview = ({ title, path, image }) => {
  const { id, childImageSharp } = image;

  return (
    <Link to={path}>
      <Img
        alt=""
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

Preview.propTypes = {
  path: PropTypes.string.isRequired,
  title: PropTypes.string,
  image: PropTypes.shape({
    id: PropTypes.string.isRequired,
    childImageSharp: PropTypes.shape({
      fluid: PropTypes.object.isRequired,
    }),
  }),
};
