const path = require('path');
const slugify = require('slugify');
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

  // Create paginated post list pages
  const postsPerPage = 60;
  const numPages = Math.ceil(posts.length / postsPerPage);
  const indexTemplate = path.resolve('./src/templates/index.js');
  Array.from({ length: numPages }).forEach((_, i) => {
    createPage({
      path: i === 0 ? '/' : `${i + 1}`,
      component: indexTemplate,
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

  // Create tags list pages
  const tags = result.data.tagsGroup.group;
  const tagTemplate = path.resolve('./src/templates/tags.js');

  const slugifyConfig = {
    lower: true,
  };

  tags.forEach((tag) => {
    console.log(tag.fieldValue);
    createPage({
      path: `/tags/${slugify(tag.fieldValue, slugifyConfig)}`,
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
    const fileNode = getNode(node.parent);
    const slug = createFilePath({ node, getNode });
    let prefix = `/${fileNode.sourceInstanceName}`;

    // Set a path prefix for states
    if (fileNode.sourceInstanceName === 'states') {
      prefix = '/s';
    }

    console.log(`${slug}`);

    createNodeField({
      node,
      name: 'slug',
      value: `${prefix}${slug}`,
    });
  }
};
