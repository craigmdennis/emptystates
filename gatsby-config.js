module.exports = {
  siteMetadata: {
    title: `Empty States`,
    description: `A curated gallery showcasing designs where no data is available in the UI.`,
    siteUrl: `https://emptystat.es`,
    social: {
      twitter: `emptystates`,
    },
    homepage: {
      title: `Delight your users.`,
    },
  },
  plugins: [
    'gatsby-transformer-yaml',
    'gatsby-plugin-sharp',
    'gatsby-transformer-sharp',
    'gatsby-plugin-react-helmet',
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `content`,
        path: `${__dirname}/content`,
      },
    },
    {
      resolve: 'gatsby-plugin-robots-txt',
      options: {
        env: {
          development: {
            policy: [{ userAgent: '*', disallow: ['/'] }],
          },
          production: {
            policy: [{ userAgent: '*', allow: '/' }],
          },
        },
      },
    },
    `gatsby-plugin-sitemap`,
    `gatsby-plugin-netlify`,
    'gatsby-plugin-react-svg',
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
  ],
};
