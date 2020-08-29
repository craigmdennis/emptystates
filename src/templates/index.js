import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'gatsby';

import Layout from '../components/Layout';
import SEO from '../components/Seo';
import Gallery from '../components/Gallery';
import Preview from '../components/Preview';
import Header from '../components/Header';

const IndexPage = ({ data }) => {
  const { edges } = data.allMarkdownRemark;
  const { description } = data.site.siteMetadata;
  const pageTitle = 'Delight your users';

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
      <SEO />

      <Header large={true} title={pageTitle} description={description} />

      <Gallery>{previews}</Gallery>
    </Layout>
  );
};

export default IndexPage;

export const pageQuery = graphql`
  query pageQuery($skip: Int!, $limit: Int!) {
    site {
      siteMetadata {
        title
        description
      }
    }
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
  data: PropTypes.object.isRequired,
};
