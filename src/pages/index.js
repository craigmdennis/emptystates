import React from "react";
import Helmet from "react-helmet";
import { Link, graphql } from "gatsby";
import Gallery from "../components/gallery";
import Layout from "../components/layout";
import Header from "../components/header";
import Preview from "../components/preview";

const IndexPage = ({ data }) => {
  const { title, description, homepage } = data.site.siteMetadata;

  return (
    <Layout>
      <Helmet title={title} />
      <Header large={true} title={homepage.title} description={description} />

      <Gallery>
        {data.allStatesYaml.edges.map(({ node }, index) => (
          <Preview key={index} node={node} />
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
