import React from 'react';
import { graphql } from 'gatsby';

import Layout from '../components/Layout';
import SEO from '../components/Seo';
import Gallery from '../components/Gallery';
import Preview from '../components/Preview';
import Header from '../components/Header';

const IndexPage = ({ data }) => {
  const {
    description,
    homepage: { title },
  } = data.site.siteMetadata;

  return (
    <Layout>
      <SEO />

      <Header large={true} title={title} description={description} />

      <Gallery>
        {data.allStatesYaml.nodes.map(({ title, path, image }, index) => (
          <Preview key={index} title={title} path={path} image={image} />
        ))}
      </Gallery>
    </Layout>
  );
};

export default IndexPage;

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        homepage {
          title
        }
        title
        description
      }
    }
    allStatesYaml {
      totalCount
      nodes {
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
`;
