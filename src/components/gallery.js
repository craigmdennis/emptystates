import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styles from '../styles/gallery.module.css';

const Gallery = ({ children, columnCount = 3, wide }) => {
  const [numCols, setNumCols] = useState(columnCount);
  const cols = [...Array(numCols)].map(() => []);
  const fillCols = (children, cols) => {
    children.forEach((child, i) => cols[i % cols.length].push(child));
  };

  fillCols(children, cols);

  return (
    <div className={`${styles.gallery} ${wide ? styles.wide : ''}`}>
      {[...Array(numCols)].map((_, index) => (
        <div className={styles.col} key={index}>
          {cols[index]}
        </div>
      ))}
    </div>
  );
};

Gallery.propTypes = {
  children: PropTypes.array.isRequired,
  columnCount: PropTypes.number,
  wide: PropTypes.bool,
};

export default Gallery;
