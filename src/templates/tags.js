import React from 'react';
import { graphql } from 'gatsby';
import _ from 'lodash';

import Layout from '../components/Layout';
import SEO from '../components/Seo';
import Gallery from '../components/Gallery';
import Preview from '../components/Preview';
import Header from '../components/Header';

import processTags from '../utils/processTags';

const Tags = ({ pageContext, data }) => {
  const { tag } = pageContext;
  const title = processTags(tag);

  return (
    <Layout>
      <SEO title={title} />
      <Header title={title} />

      <Gallery>
        {data.allStatesYaml.nodes.map(({ title, path, image }, index) => (
          <Preview key={index} title={title} path={path} image={image} />
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
