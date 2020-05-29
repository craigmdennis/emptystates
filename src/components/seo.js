/**
 * SEO component that queries for data with
 *  Gatsby's useStaticQuery React hook
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import { useStaticQuery, graphql } from 'gatsby';
// import defaultOpenGraphImage from '../images/craigmdennis.png';

const SEO = ({ description, lang, meta, keywords, title, image }) => {
  const { site } = useStaticQuery(
    graphql`
      query {
        site {
          siteMetadata {
            title
            description
            siteUrl
          }
        }
      }
    `
  );

  const metaDescription = description || site.siteMetadata.description;
  // const ogImageUrl =
  //   site.siteMetadata.siteUrl + (image || defaultOpenGraphImage);

  return (
    <Helmet
      htmlAttributes={{
        lang,
      }}
      defaultTitle={`${site.siteMetadata.title}`}
      title={title}
      titleTemplate={`%s — ${site.siteMetadata.title}`}
      meta={[
        {
          name: 'description',
          content: metaDescription,
        },
        {
          property: 'og:title',
          content: title,
        },
        {
          property: 'og:description',
          content: metaDescription,
        },
        // {
        //   property: 'og:image',
        //   content: ogImageUrl,
        // },
        // {
        //   property: 'image',
        //   content: ogImageUrl,
        // },
        {
          property: 'og:type',
          content: 'website',
        },
        {
          name: 'twitter:card',
          content: 'summary',
        },
        {
          name: 'twitter:creator',
          content: '@emptystates',
        },
        {
          name: 'twitter:title',
          content: title,
        },
        {
          name: 'twitter:description',
          content: metaDescription,
        },
        // {
        //   property: 'twitter:image',
        //   content: ogImageUrl,
        // },
      ]
        .concat(
          keywords.length > 0
            ? {
                name: 'keywords',
                content: keywords.join(', '),
              }
            : []
        )
        .concat(meta)}
    />
  );
};

SEO.defaultProps = {
  lang: 'en',
  meta: [],
  keywords: ['inspiration', 'gatsby', 'empty states', 'design'],
};

SEO.propTypes = {
  description: PropTypes.string,
  lang: PropTypes.string,
  meta: PropTypes.array,
  keywords: PropTypes.arrayOf(PropTypes.string),
  title: PropTypes.string.isRequired,
};

export default SEO;
