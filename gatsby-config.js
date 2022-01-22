module.exports = {
  siteMetadata: {
    title: 'Empty States',
    description:
      'A curated gallery showcasing designs where no data is available in the UI.',
    siteUrl: 'https://emptystat.es',
    social: {
      twitter: 'emptystates',
    },
  },
  plugins: [
    'gatsby-plugin-postcss',
    'gatsby-plugin-sharp',
    'gatsby-transformer-sharp',
    'gatsby-plugin-react-helmet',
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'states',
        path: `${__dirname}/content/states`,
      },
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'images',
        path: `${__dirname}/src/images`,
        ignore: [`**/\.*`],
      },
    },
    {
      resolve: 'gatsby-transformer-remark',
      options: {
        plugins: [], // just in case those previously mentioned remark plugins sound cool :)
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
    'gatsby-plugin-sitemap',
    'gatsby-plugin-react-svg',
    {
      resolve: 'gatsby-plugin-manifest',
      options: {
        name: 'Empty States',
        short_name: 'Empty States',
        start_url: '/',
        background_color: '#f8f8fe',
        theme_color: '#3c4858',
        display: 'standalone',
        icon: 'src/images/logo.svg',
      },
    },
    {
      resolve: 'gatsby-plugin-offline',
      options: {
        precachePages: ['/mobile/'],
        workboxConfig: {
          globPatterns: ['**/icon*'],
        },
      },
    },
  ],
};
