import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'gatsby';
import Img from 'gatsby-image';
import _ from 'lodash';

import Layout from '../components/Layout';
import SEO from '../components/Seo';
import Header from '../components/Header';
import TagList from '../components/taglist';
import styles from '../styles/post.module.css';

const PostTemplate = ({ data }) => {
  const {
    title,
    description,
    tags,
    date,
    image,
  } = data.markdownRemark.frontmatter;
  const { slug } = data.markdownRemark.fields;
  const classes = _.includes(tags, 'desktop') ? styles.wide : styles.item;

  console.log(tags);

  const EditLink = () => {
    const admin = `http://localhost:8000/admin/#/collections/states/entries${slug}index`;
    return <a href={`${admin}`}>Edit</a>;
  };

  return (
    <Layout>
      <SEO title={title} />
      <Header title={title} />

      <Img
        className={`${styles.item} ${classes}`}
        alt={`Screenshot of ${title}`}
        fluid={image.childImageSharp.fluid}
        key={image.id}
      />

      {process.env.NODE_ENV === 'development' && <EditLink />}

      <p>{date}</p>

      {description && <p>{description}</p>}
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
        title
        tags
        date(formatString: "MMMM DD, YYYY")
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

PostTemplate.propTypes = {
  data: PropTypes.object.isRequired,
};
