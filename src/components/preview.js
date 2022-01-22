import React from 'react';
import { Link } from 'gatsby';
import { GatsbyImage } from 'gatsby-plugin-image';
import PropTypes from 'prop-types';

import * as styles from '../styles/preview.module.css';

const Preview = ({ title, path, image }) => {
  const { id, childImageSharp } = image;

  return (
    <Link to={path}>
      <GatsbyImage
        alt=""
        loading="lazy"
        className={styles.item}
        key={id}
        image={childImageSharp.gatsbyImageData}
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
