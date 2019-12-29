const _ = require("lodash");
const path = require("path");
const { createFilePath } = require("gatsby-source-filesystem");
const { fmImagesToRelative } = require("gatsby-remark-relative-images");

exports.createPages = ({ actions, graphql }) => {
  const { createPage } = actions;

  return graphql(`
    query {
      allStatesYaml {
        edges {
          node {
            fields {
              slug
            }
          }
        }
      }
    }
  `).then(result => {
    if (result.errors) {
      result.errors.forEach(e => console.error(e.toString()));
      return Promise.reject(result.errors);
    }

    const posts = result.data.allStatesYaml.edges;
    const postTemplate = path.resolve("./src/templates/post.js");

    posts.forEach(post => {
      createPage({
        path: post.node.fields.slug,
        component: postTemplate,
        // additional data can be passed via context
        context: {
          slug: post.node.fields.slug,
        },
      });
    });
  });
};

// https://stevenmercatante.com/use-custom-paths-in-gatsby
exports.onCreateNode = ({ node, actions, getNode }) => {
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
