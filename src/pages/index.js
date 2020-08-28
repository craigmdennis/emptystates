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

  // Iterate over the data and populate an array of Previews
  const previews = data.allMarkdownRemark.edges.map((edge, index) => {
    const { frontmatter, fields } = edge.node;

    return (
      <Preview
        key={index}
        title={frontmatter.title}
        path={fields.slug}
        image={frontmatter.image}
      />
    );
  });

  return (
    <Layout>
      <SEO />

      <Header large={true} title={title} description={description} />

      <Gallery>{previews}</Gallery>
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
    allMarkdownRemark {
      edges {
        node {
          fields {
            slug
          }
          html
          frontmatter {
            # date(formatString: "MMMM DD, YYYY")
            # title
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
