import React from "react";
import Helmet from "react-helmet";
import { StaticQuery, Link, graphql } from "gatsby";
import Gallery from "../components/gallery";
import Layout from "../components/layout";
import Header from "../components/header";

const IndexPage = ({
  data: {
    site: { siteMetadata },
    allStatesYaml,
  },
}) => {
  return (
    <Layout>
      <Helmet title={siteMetadata.title} />
      <Header
        title={siteMetadata.homepage.title}
        description={siteMetadata.description}
      />
      <Gallery
        images={allStatesYaml.edges.map(({ node }) => ({
          id: node.image.id,
          ...node.image.childImageSharp.fluid,
          path: node.path,
        }))}
        itemsPerRow={4}
      />
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
      edges {
        node {
          title
          path
          image {
            id
            childImageSharp {
              fluid {
                aspectRatio
                ...GatsbyImageSharpFluid_withWebp
              }
            }
          }
        }
      }
    }
  }
`;
