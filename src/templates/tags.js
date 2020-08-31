import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'gatsby';
import _ from 'lodash';

import Layout from '../components/Layout';
import SEO from '../components/Seo';
import Gallery from '../components/Gallery';
import Preview from '../components/Preview';
import Header from '../components/Header';
import Pagination from '../components/Pagination';

const TagPage = ({ data, pageContext }) => {
  const { edges, totalCount } = data.allMarkdownRemark;
  const { numPages, currentPage, tag } = pageContext;
  const pageTitle = `${tag === 'ios' ? 'iOS' : _.capitalize(tag)} States`;
  const tags = pageContext.tags;

  let columnCount = 3;
  let wide = false;
  // const description = `${totalCount} result${totalCount === 1 ? '' : 's'}`;

  // Reduce the column count when desktop tagged
  if (tag === 'desktop') {
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
      <Gallery wide={wide} columnCount={columnCount}>
        {previews}
      </Gallery>
      {/* <Pagination numPages={numPages} currentPage={currentPage} /> */}
    </Layout>
  );
};

export default TagPage;

export const pageQuery = graphql`
  query tagPageQuery($tag: String) {
    allMarkdownRemark(
      sort: { fields: [frontmatter___date], order: DESC }
      filter: { frontmatter: { tags: { in: [$tag] } } }
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
                fluid(maxWidth: 800) {
                  ...GatsbyImageSharpFluid_withWebp
                }
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
      totalCount: PropTypes.number.isRequired,
    }),
  }),
  pageContext: PropTypes.shape({
    // numPages: PropTypes.number.isRequired,
    // currentPage: PropTypes.number.isRequired,
    tag: PropTypes.string.isRequired,
  }),
};
