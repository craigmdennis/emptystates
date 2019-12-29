const _ = require("lodash");
const path = require("path");

exports.createPages = ({ actions, graphql }) => {
  const { createPage } = actions;

  return graphql(`
    query {
      postsYaml: allStatesYaml(
        sort: { order: DESC, fields: [date] }
        limit: 2000
      ) {
        edges {
          node {
            fields {
              slug
            }
          }
        }
      }
      tagsGroup: allStatesYaml(limit: 2000) {
        group(field: tags) {
          fieldValue
        }
      }
    }
  `).then(result => {
    // Handle errors
    if (result.errors) {
      result.errors.forEach(e => console.error(e.toString()));
      return Promise.reject(result.errors);
    }

    // Create post pages
    const posts = result.data.postsYaml.edges;
    const postTemplate = path.resolve("./src/templates/post.js");

    posts.forEach(post => {
      createPage({
        path: post.node.fields.slug,
        component: postTemplate,
        context: {
          slug: post.node.fields.slug,
        },
      });
    });

    // Create tag pages
    // www.gatsbyjs.org/docs/adding-tags-and-categories-to-blog-posts/
    const tags = result.data.tagsGroup.group;
    const tagTemplate = path.resolve("./src/templates/tags.js");

    tags.forEach(tag => {
      createPage({
        path: `/tags/${_.kebabCase(tag.fieldValue)}/`,
        component: tagTemplate,
        context: {
          tag: tag.fieldValue,
        },
      });
    });
  });
};

// https://stevenmercatante.com/use-custom-paths-in-gatsby
exports.onCreateNode = ({ node, actions }) => {
  const { createNodeField } = actions;

  if (node.internal.type === `StatesYaml`) {
    const slug = node.path;

    createNodeField({
      node,
      name: `slug`,
      value: slug,
    });
  }
};
