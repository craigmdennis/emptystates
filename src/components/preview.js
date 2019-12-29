import React from "react";
import { Link } from "gatsby";
import Img from "gatsby-image";
import styles from "./preview.module.css";

const Preview = ({ post }) => {
  const { image } = post;

  return (
    <div className={styles.preview}>
      <Link to={post.fields.slug} className={styles.link}>
        <Img
          alt={image.alt ? image.alt : ""}
          fluid={image.childImageSharp.fluid}
          key={post.id}
        />
      </Link>
    </div>
  );
};

export default Preview;
