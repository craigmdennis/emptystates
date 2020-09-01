import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'gatsby';
import slugify from 'slugify';

import styles from '../styles/taglist.module.css';

const TagList = ({ tags }) => {
  const slugifyConfig = {
    lower: true,
  };

  return (
    <ul className={styles.taglist}>
      {tags.map((tag, index) => (
        <li key={index}>
          <Link
            to={`/tags/${slugify(tag, slugifyConfig)}/`}
            className={styles.taglist__tag}
          >
            {tag}
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default TagList;

TagList.propTypes = {
  tags: PropTypes.arrayOf(PropTypes.string),
};
