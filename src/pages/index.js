import React from "react";
import PropTypes from "prop-types";
import Helmet from "react-helmet";
import { Link, graphql } from "gatsby";
import Layout from "../components/layout";
import Preview from "../components/preview";
import Header from "../components/header";

const IndexPage = ({
  data: {
    allStatesYaml: { edges },
    site: { siteMetadata },
  },
}) => {
  const Posts = edges
    .filter(edge => !!edge.node.date) // You can filter your posts based on some criteria
    .map(edge => <Preview key={edge.node.id} post={edge.node} />);
  return (
    <Layout>
      <Helmet title={siteMetadata.title} />
      <Header
        title={siteMetadata.homepage.title}
        description={siteMetadata.description}
      />
      {Posts}
    </Layout>
  );
};

Header.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
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
    allStatesYaml(sort: { order: DESC, fields: [date] }) {
      edges {
        node {
          id
          title
          date(formatString: "MMMM DD, YYYY")
          description
          tags
          fields {
            slug
          }
          image {
            childImageSharp {
              fluid(maxWidth: 800) {
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
