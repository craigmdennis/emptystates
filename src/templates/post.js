import React from 'react';
import { graphql } from 'gatsby';
import Img from 'gatsby-image';
import _ from 'lodash';

import Layout from '../components/Layout';
import SEO from '../components/Seo';
import Header from '../components/Header';
// import TagList from '../components/taglist'
import styles from '../styles/post.module.css';

const PostTemplate = ({ data }) => {
  const { frontmatter, fields } = data.markdownRemark;
  // const classes = _.includes(tags, 'desktop') ? styles.wide : styles.item;

  return (
    <Layout>
      <SEO title={frontmatter.title} />
      <Header title={frontmatter.title} />

      {frontmatter.description && <p>{frontmatter.description}</p>}

      <Img
        className={styles.item}
        alt={`Screenshot of ${frontmatter.title}`}
        fluid={frontmatter.image.childImageSharp.fluid}
        key={frontmatter.image.id}
      />

      {/* <ul>
        {product.name && <li>{product.name}</li>}
        <li>{date}</li>
      </ul> */}

      {/* {comment && <p>{comment}</p>} */}

      {/* TODO: Add list of all screens with the same ${product} */}
    </Layout>
  );
};

export default PostTemplate;

export const postQuery = graphql`
  query PostQuery($slug: String!) {
    site {
      siteMetadata {
        title
      }
    }
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      fields {
        slug
      }
      frontmatter {
        # date(formatString: "MMMM DD, YYYY")
        image {
          id
          childImageSharp {
            fluid(maxWidth: 800) {
              ...GatsbyImageSharpFluid_withWebp
            }
          }
        }
      }
    }
  }
`;
