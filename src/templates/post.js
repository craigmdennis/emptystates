import React from 'react';
import { graphql } from 'gatsby';
import { Helmet } from 'react-helmet';
import Img from 'gatsby-image';
import _ from 'lodash';
import Header from '../components/header';
import Layout from '../components/layout';
// import TagList from '../components/taglist'
import styles from './post.module.css';

const PostTemplate = ({ data: { statesYaml, site } }) => {
  const {
    title,
    description,
    date,
    image,
    tags,
    product,
    comment,
  } = statesYaml;
  const classes = _.includes(tags, 'desktop') ? styles.wide : styles.item;
  const alt = image.alt ? image.alt : '';

  return (
    <Layout>
      <Helmet title={`${title} | ${site.siteMetadata.title}`} />

      <Header title={title} />

      {description && <p>{description}</p>}

      <Img
        className={classes}
        alt={alt}
        fluid={image.childImageSharp.fluid}
        key={image}
      />

      <ul>
        {product.name && <li>{product.name}</li>}
        <li>{date}</li>
      </ul>

      {comment && <p>{comment}</p>}

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
    statesYaml(fields: { slug: { eq: $slug } }) {
      title
      date(formatString: "MMMM DD, YYYY")
      description
      product {
        name
      }
      comment
      tags
      fields {
        slug
      }
      image {
        childImageSharp {
          fluid(maxWidth: 800) {
            ...GatsbyImageSharpFluid_withWebp
          }
        }
      }
    }
  }
`;
