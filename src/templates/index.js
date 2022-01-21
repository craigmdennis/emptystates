import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'gatsby';

import Layout from '../components/layout';
import SEO from '../components/seo.js';
import Gallery from '../components/gallery';
import Preview from '../components/preview';
import Header from '../components/header';
import Pagination from '../components/pagination';

const IndexPage = ({ data, pageContext }) => {
  const { edges } = data.allMarkdownRemark;
  const { numPages, currentPage, site } = pageContext;
  const pageTitle = 'Delight your users';

  // Iterate over the data and populate an array of Previews
  const previews = edges.map((edge, index) => {
    const { title, image, referral } = edge.node.frontmatter;
    const { slug } = edge.node.fields;

    return <Preview key={index} title={title} path={slug} image={image} />;
  });

  return (
    <Layout>
      <SEO />
      {currentPage === 1 ? (
        <Header
          large={true}
          title={pageTitle}
          description={site.siteMetadata.description}
        />
      ) : (
        ''
      )}
      <Gallery>{previews}</Gallery>
      {numPages > 1 && (
        <Pagination numPages={numPages} currentPage={currentPage} />
      )}
    </Layout>
  );
};

export default IndexPage;

export const pageQuery = graphql`
  query pageQuery($skip: Int!, $limit: Int!) {
    allMarkdownRemark(
      sort: { fields: [frontmatter___date], order: DESC }
      limit: $limit
      skip: $skip
    ) {
      edges {
        node {
          fields {
            slug
          }
          html
          frontmatter {
            date(formatString: "MMMM DD, YYYY")
            title
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

IndexPage.propTypes = {
  data: PropTypes.shape({
    allMarkdownRemark: PropTypes.shape({
      edges: PropTypes.array.isRequired,
    }),
  }),
  pageContext: PropTypes.shape({
    numPages: PropTypes.number.isRequired,
    currentPage: PropTypes.number.isRequired,
    site: PropTypes.shape({
      siteMetadata: PropTypes.object.isRequired,
    }),
  }),
};
