import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'gatsby';
import _ from 'lodash';

import Layout from '../components/layout';
import SEO from '../components/seo.js';
import Gallery from '../components/gallery';
import Preview from '../components/preview';
import Header from '../components/header';
import Pagination from '../components/pagination';

import displayTagNameCorrectly from '../utils/displayTagNameCorrectly';

const TagPage = ({ data, pageContext }) => {
  const { edges } = data.allMarkdownRemark;
  const { tag, numPages, currentPage } = pageContext;
  const pageTitle = `${displayTagNameCorrectly(tag)} States`;
  const shouldUseWide = ['desktop', 'tablet', 'macOS'];

  let columnCount = 3;
  let wide = false;

  // Reduce the column count when desktop or tablet tagged
  if (shouldUseWide.includes(tag.toLowerCase())) {
    columnCount = 2;
    wide = true;
  }

  // Iterate over the data and populate an array of Previews
  const previews = edges.map((edge, index) => {
    const {
      frontmatter: { title, image },
      fields: { slug },
    } = edge.node;

    return <Preview key={index} title={title} path={slug} image={image} />;
  });

  return (
    <Layout>
      <SEO title={pageTitle} />
      <Header title={pageTitle} />
      <Gallery columnCount={columnCount} wide={wide}>
        {previews}
      </Gallery>
      {numPages > 1 && (
        <Pagination
          numPages={numPages}
          currentPage={currentPage}
          basePath={`tags/${tag}/`}
        />
      )}
    </Layout>
  );
};

export default TagPage;

export const pageQuery = graphql`
  query tagPageQuery($tag: String, $skip: Int!, $limit: Int!) {
    allMarkdownRemark(
      sort: { fields: [frontmatter___date], order: DESC }
      filter: { frontmatter: { tags: { in: [$tag] } } }
      limit: $limit
      skip: $skip
    ) {
      group(field: frontmatter___tags) {
        fieldValue
        totalCount
      }
      totalCount
      edges {
        node {
          fields {
            slug
          }
          html
          frontmatter {
            date(formatString: "MMMM DD, YYYY")
            title
            tags
            image {
              id
              childImageSharp {
                gatsbyImageData(
                  layout: CONSTRAINED
                  width: 800
                  placeholder: BLURRED
                  formats: [AUTO, WEBP]
                )
              }
            }
          }
        }
      }
    }
  }
`;

TagPage.propTypes = {
  data: PropTypes.shape({
    allMarkdownRemark: PropTypes.shape({
      edges: PropTypes.array.isRequired,
    }),
  }),
  pageContext: PropTypes.shape({
    tag: PropTypes.string.isRequired,
    numPages: PropTypes.number.isRequired,
    currentPage: PropTypes.number.isRequired,
  }),
};
