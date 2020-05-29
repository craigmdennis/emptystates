import React, { useState } from 'react';
import styles from '../styles/gallery.module.css';

const Gallery = ({ children, columnCount = 3 }) => {
  const [numCols, setNumCols] = useState(columnCount);
  const cols = [...Array(numCols)].map(() => []);
  const fillCols = (children, cols) => {
    children.forEach((child, i) => cols[i % cols.length].push(child));
  };

  fillCols(children, cols);

  return (
    <div className={styles.gallery}>
      {[...Array(numCols)].map((_, index) => (
        <div className={styles.col} key={index}>
          {cols[index]}
        </div>
      ))}
    </div>
  );
};

export default Gallery;
