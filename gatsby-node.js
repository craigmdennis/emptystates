exports.createPages = async function ({ actions, graphql }) {
  const { data } = await graphql(`
    query {
      site {
        siteMetadata {
          title
        }
      }
      allMdx {
        edges {
          node {
            slug
          }
        }
      }
    }
  `);
  data.allMdx.edges.forEach((edge) => {
    const { slug } = edge.node;
    actions.createPage({
      path: `/s/${slug}`,
      component: require.resolve('./src/templates/state.jsx'),
      context: { slug },
    });
  });
};
