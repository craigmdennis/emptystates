import React from 'react';
import { Helmet } from 'react-helmet';
import { graphql } from 'gatsby';
import Gallery from '../components/gallery';
import Layout from '../components/layout';
import Header from '../components/header';
import Preview from '../components/preview';

const Tags = ({ pageContext, data }) => {
  const { tag } = pageContext;
  const { title } = data.site.siteMetadata;

  // Special case for iOS
  const tagTitle = tag !== 'ios' ? _.startCase(tag) : 'iOS';

  return (
    <Layout>
      <Helmet title={`${tagTitle} | ${title}`} />
      <Header title={tagTitle} />

      <Gallery>
        {data.allStatesYaml.edges.map((edge, index) => (
          <Preview key={index} path={edge.node.path} image={edge.node.image} />
        ))}
      </Gallery>
    </Layout>
  );
};

export default Tags;

export const pageQuery = graphql`
  query($tag: String) {
    site {
      siteMetadata {
        title
      }
    }
    allStatesYaml(
      limit: 2000
      sort: { fields: [date], order: DESC }
      filter: { tags: { in: [$tag] } }
    ) {
      totalCount
      edges {
        node {
          title
          path
          fields {
            slug
          }
          image {
            id
            childImageSharp {
              fluid {
                ...GatsbyImageSharpFluid_withWebp
              }
            }
          }
        }
      }
    }
  }
`;
