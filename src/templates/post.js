import PropTypes from "prop-types";
import React from "react";
import { graphql } from "gatsby";
import Helmet from "react-helmet";
import Img from "gatsby-image";
import _ from "lodash";
import Header from "../components/header";
import Layout from "../components/layout";
// import TagList from '../components/taglist'
import styles from "./post.module.css";

const PostTemplate = ({
  data: {
    site: {
      siteMetadata: { title },
    },
    markdownRemark: { frontmatter },
  },
}) => {
  console.log(frontmatter, title);

  const classes = _.includes(frontmatter.tags, "Desktop")
    ? styles.wide
    : styles.item;

  return (
    <Layout>
      <Helmet title={`${frontmatter.title} | ${title}`} />
      <Header title={frontmatter.title} />
      {frontmatter.description && <p>{frontmatter.description}</p>}
      {/* <Img fluid={frontmatter.image.fluid} className={classes} /> */}
      <div>
        <small>{frontmatter.publishDate}</small>
      </div>
      {/* <TagList tags={frontmatter.tags} /> */}
    </Layout>
  );
};

export default PostTemplate;

export const pageQuery = graphql`
  query PostQuery($slug: String!) {
    site {
      siteMetadata {
        title
      }
    }
    markdownRemark(fields: { slug: { eq: $slug } }) {
      id
      excerpt(pruneLength: 160)
      html
      fields {
        slug
      }
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
        description
      }
    }
  }
`;
