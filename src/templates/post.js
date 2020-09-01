import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'gatsby';
import Img from 'gatsby-image';
import _ from 'lodash';

import Layout from '../components/layout';
import SEO from '../components/seo';
import Header from '../components/header';
import TagList from '../components/taglist';
import styles from '../styles/post.module.css';

const PostTemplate = ({ data, pageContext }) => {
  const { title, tags, date, related, image } = data.markdownRemark.frontmatter;

  const { html } = data.markdownRemark;
  const { slug } = pageContext;
  const classes = _.includes(tags, 'desktop') ? styles.wide : styles.item;

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

      {tags && <TagList tags={tags} />}

      {html && <div dangerouslySetInnerHTML={{ __html: html }} />}
    </Layout>
  );
};

export default PostTemplate;

export const postQuery = graphql`
  query PostQuery($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      frontmatter {
        title
        tags
        date(formatString: "MMMM DD, YYYY")
        related
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
  data: PropTypes.shape({
    markdownRemark: PropTypes.shape({
      html: PropTypes.any,
      frontmatter: PropTypes.shape({
        title: PropTypes.string,
        tags: PropTypes.array.isRequired,
        date: PropTypes.string,
        related: PropTypes.array,
        image: PropTypes.shape({
          id: PropTypes.string.isRequired,
          childImageSharp: PropTypes.object.isRequired,
        }),
      }),
    }),
  }),
  pageContext: PropTypes.shape({
    slug: PropTypes.string.isRequired,
  }),
};
