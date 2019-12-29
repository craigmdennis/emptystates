import Img from "gatsby-image";
import { Link } from "gatsby";
import { chunk, sum } from "lodash";
import React from "react";
import styles from "./gallery.module.css";

const Gallery = ({ images, itemsPerRow }) => {
  // Split images into groups of the given size
  const rows = chunk(images, itemsPerRow);

  return (
    <div className={styles.gallery}>
      {rows.map(row => {
        // Sum aspect ratios of images in the given row
        const rowAspectRatioSum = sum(row.map(image => image.aspectRatio));

        return row.map(image => (
          <Link to={image.path} className={styles.link}>
            <Img
              key={image.id}
              className={styles.item}
              style={{
                width: `${(image.aspectRatio / rowAspectRatioSum) * 100}%`,
              }}
              fluid={image}
            />
          </Link>
        ));
      })}
    </div>
  );
};

export default Gallery;
