import React from "react";
import { Link } from "gatsby";
import Img from "gatsby-image";
import styles from "./preview.module.css";

const Preview = ({ node }) => {
  return (
    <Link to={node.path}>
      <Img
        className={styles.item}
        key={node.image.id}
        fluid={node.image.childImageSharp.fluid}
      />
    </Link>
  );
};

export default Preview;
