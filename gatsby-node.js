const path = require('path');
const slugify = require('slugify');
const { createFilePath } = require('gatsby-source-filesystem');

// Posts & Tags to show per page
const POSTS_PER_PAGE = 60;

// Allow non-existent frontmatter fields
// github.com/gatsbyjs/gatsby/issues/2392#issuecomment-526637536
// https: exports.createSchemaCustomization = ({ actions }) => {
//   const { createTypes } = actions;
//   const typeDefs = `
//     type MarkdownRemark implements Node {
//       frontmatter: Frontmatter
//     }
//     type Frontmatter {
//       title: [String!]!
//       date: [Date!]!
//       image: [String!]!
//       tags: [String!]!
//     }
//   `;
//   createTypes(typeDefs);
// };

// Create redirect if present in the frontmatter

exports.createPages = async ({ actions, graphql, reporter }) => {
  const { createPage } = actions;

  const result = await graphql(`
    {
      site {
        siteMetadata {
          title
          description
        }
      }
      postsRemark: allMarkdownRemark(
        sort: { fields: [frontmatter___date], order: DESC }
        limit: 1000
      ) {
        edges {
          node {
            frontmatter {
              redirect
            }
            fields {
              slug
            }
          }
        }
      }
      tagsGroup: allMarkdownRemark(limit: 1000) {
        group(field: frontmatter___tags) {
          fieldValue
          totalCount
        }
      }
    }
  `);

  if (result.errors) {
    reporter.panicOnBuild('Error while running GraphQL query.');
    result.errors.forEach((e) => console.error(e.toString()));
    return Promise.reject(result.errors);
  }

  // Create individual post pages
  const posts = result.data.postsRemark.edges;
  const postTemplate = path.resolve('./src/templates/post.js');

  posts.forEach((post) => {
    const { redirect, slug } = post.node.fields;
    const { createRedirect } = actions;

    console.log(redirect);

    if (redirect && redirect !== '') {
      createRedirect({
        fromPath: redirect,
        toPath: slug,
        isPermanent: true,
      });
    }

    createPage({
      path: slug,
      component: postTemplate,
      context: {
        slug: slug,
        site: result.data.site,
      },
    });
  });

  // Create paginated index pages
  const numPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const indexTemplate = path.resolve('./src/templates/index.js');
  Array.from({ length: numPages }).forEach((_, i) => {
    createPage({
      path: i === 0 ? '/' : `${i + 1}`,
      component: indexTemplate,
      context: {
        limit: POSTS_PER_PAGE,
        skip: i * POSTS_PER_PAGE,
        numPages: numPages,
        currentPage: i + 1,
        site: result.data.site,
        tags: result.data.tagsGroup.group,
      },
    });
  });

  // Create tags list pages
  const tags = result.data.tagsGroup.group;
  const tagTemplate = path.resolve('./src/templates/tags.js');

  const slugifyConfig = {
    lower: true,
  };

  /// Need to paginate
  tags.forEach((tag) => {
    const numPages = Math.ceil(tag.totalCount / POSTS_PER_PAGE);
    Array.from({ length: numPages }).forEach((_, i) => {
      createPage({
        path:
          i === 0
            ? `/tags/${slugify(tag.fieldValue, slugifyConfig)}`
            : `/tags/${slugify(tag.fieldValue, slugifyConfig)}/${i + 1}`,
        component: tagTemplate,
        context: {
          limit: POSTS_PER_PAGE,
          skip: i * POSTS_PER_PAGE,
          numPages: numPages,
          currentPage: i + POSTS_PER_PAGE,
          tag: tag.fieldValue,
          site: result.data.site,
        },
      });
    });
  });
};

// Create standalone pages
exports.onCreateNode = ({ node, getNode, actions }) => {
  const { createNodeField } = actions;

  if (node.internal.type === 'MarkdownRemark') {
    const fileNode = getNode(node.parent);
    const slug = createFilePath({ node, getNode });
    let prefix = `/${fileNode.sourceInstanceName}`;

    // Set a path prefix for states
    if (fileNode.sourceInstanceName === 'states') {
      prefix = '/s';
    }

    createNodeField({
      node,
      name: 'slug',
      value: `${prefix}${slug}`,
    });
  }
};
