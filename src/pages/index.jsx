import * as React from 'react';
import { Link, graphql } from 'gatsby';
import Layout from '../components/layout';
import Gallery from '../components/Gallery';

const IndexPage = ({ data }) => (
  <Layout pageTitle="Find inspiration for your empty states.">
    <p>
      Browse or search for designs demonstrating how others handle an empty
      screen.
    </p>
    <Link to="/submit/">Submit your own</Link>
    <Gallery nodes={data.allMdx.nodes} />
  </Layout>
);

export const query = graphql`
  query StatesQuery {
    allMdx(sort: {fields: frontmatter___date, order: DESC}) {
      totalCount
      nodes {
        frontmatter {
          date(formatString: "MMMM D, YYYY")
          title
          image {
            childImageSharp {
              gatsbyImageData(layout:CONSTRAINED, width: 400, height:300)
            }
          }
          product
          tags
        }
        slug
        id
        body
      }
    }
  }
`;

export default IndexPage;
