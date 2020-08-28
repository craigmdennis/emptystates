const _ = require('lodash');
const path = require('path');
const { createFilePath } = require(`gatsby-source-filesystem`);

exports.createPages = async ({ actions, graphql, reporter }) => {
  const { createPage } = actions;

  const result = await graphql(`
    {
      allMarkdownRemark(limit: 1000) {
        edges {
          node {
            fields {
              slug
            }
          }
        }
      }
    }
  `);

  if (result.errors) {
    reporter.panicOnBuild(`Error while running GraphQL query.`);
    result.errors.forEach((e) => console.error(e.toString()));
    return Promise.reject(result.errors);
  }

  // Create post pages
  const posts = result.data.allMarkdownRemark.edges;
  const postTemplate = path.resolve('./src/templates/post.js');

  posts.forEach((post) => {
    const slug = post.node.fields.slug;

    createPage({
      path: slug,
      component: postTemplate,
      context: { slug: slug },
    });
  });

  // // Create tag pages
  // // www.gatsbyjs.org/docs/adding-tags-and-categories-to-blog-posts/
};

exports.onCreateNode = ({ node, getNode, actions }) => {
  const { createNodeField } = actions;
  if (node.internal.type === `MarkdownRemark`) {
    const slug = createFilePath({ node, getNode, basePath: `pages` });
    createNodeField({
      node,
      name: `slug`,
      value: slug,
    });
  }
};
