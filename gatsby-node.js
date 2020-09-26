const slugify = require('slugify');
const path = require('path');
const { createFilePath } = require('gatsby-source-filesystem');

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
            fields {
              slug
            }
          }
        }
      }
      tagsGroup: allMarkdownRemark(limit: 2000) {
        group(field: frontmatter___tags) {
          fieldValue
        }
      }
    }
  `);

  if (result.errors) {
    reporter.panicOnBuild('Error while running GraphQL query.');
    result.errors.forEach((e) => console.error(e.toString()));
    return Promise.reject(result.errors);
  }

  // Collect Posts
  const posts = result.data.postsRemark.edges;

  // Create paginated post list pages
  const postsPerPage = 60;
  const numPages = Math.ceil(posts.length / postsPerPage);
  Array.from({ length: numPages }).forEach((_, i) => {
    createPage({
      path: i === 0 ? '/' : `/${i + 1}`,
      component: path.resolve('./src/templates/index.js'),
      context: {
        limit: postsPerPage,
        skip: i * postsPerPage,
        numPages: numPages,
        currentPage: i + 1,
        site: result.data.site,
        tags: result.data.tagsGroup.group,
      },
    });
  });

  // Create individual post pages
  const postTemplate = path.resolve('./src/templates/post.js');

  posts.forEach((post) => {
    const slug = post.node.fields.slug;

    createPage({
      path: slug,
      component: postTemplate,
      context: {
        slug: slug,
        site: result.data.site,
      },
    });
  });

  // Create tags list pages
  const tagTemplate = path.resolve('./src/templates/tags.js');
  const tags = result.data.tagsGroup.group;

  const slugifyConfig = {
    lower: true,
  };

  tags.forEach((tag) => {
    createPage({
      path: `/tags/${slugify(tag.fieldValue, slugifyConfig)}/`,
      component: tagTemplate,
      context: {
        tag: tag.fieldValue,
        site: result.data.site,
      },
    });
  });
};

// Create standalone pages
exports.onCreateNode = ({ node, getNode, actions }) => {
  const { createNodeField } = actions;

  if (node.internal.type === 'MarkdownRemark') {
    const slug = createFilePath({ node, getNode, basePath: 'pages' });

    createNodeField({
      node,
      name: 'slug',
      value: slug,
    });
  }
};
