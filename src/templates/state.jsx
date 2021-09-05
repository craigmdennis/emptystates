import * as React from 'react';
import { Helmet } from 'react-helmet';
import { graphql } from 'gatsby';
import { GatsbyImage } from 'gatsby-plugin-image';
import { MDXRenderer } from 'gatsby-plugin-mdx';
import PropTypes from 'prop-types';
import Layout from '../components/layout';

const State = ({ data }) => {
  const { date, image, title } = data.mdx.frontmatter;
  const { body } = data.mdx;

  return (
    <Layout pageTitle={title}>
      <Helmet>
        <title>{`${title} | ${data.site.siteMetadata.title}`}</title>
      </Helmet>

      <GatsbyImage alt="" image={image.childImageSharp.gatsbyImageData} />

      {date && <p>{`Posted: ${date}`}</p>}
      {body && <MDXRenderer>{body}</MDXRenderer>}
    </Layout>
  );
};

export const query = graphql`
  query StateQuery($slug: String!) {
    site {
      siteMetadata {
        title
      }
    }
    mdx(slug: { eq: $slug }) {
      frontmatter {
        title
        date(formatString: "MMMM D, YYYY")
        image {
          childImageSharp {
            gatsbyImageData(height: 1024)
          }
        }
        product
        tags
      }
      body
    }
  }
`;

export default State;

State.propTypes = {
  data: PropTypes.shape({
    mdx: PropTypes.shape({
      frontmatter: PropTypes.shape({
        date: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        image: PropTypes.isRequired,
      }),
      body: PropTypes.string,
    }),
  }).isRequired,
};
