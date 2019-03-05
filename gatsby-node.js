const Promise = require('bluebird')
const path = require('path')
const _ = require('lodash')

exports.createPages = ({ graphql, actions }) => {
  const { createPage } = actions

  return new Promise((resolve, reject) => {
    const blogPost = path.resolve('./src/templates/post.js')
    const tagTemplate = path.resolve("src/templates/tags.js")
    resolve(
      graphql(
        `
          {
            allContentfulPost(sort: { fields: [publishDate], order: DESC }) {
              edges {
                node {
                  title
                  slug
                  tags
                  contentful_id
                }
              }
            }
          }
          `
      ).then(result => {
        if (result.errors) {
          console.log(result.errors)
          reject(result.errors)
        }

        // Posts
        const posts = result.data.allContentfulPost.edges
        posts.forEach((post) => {
          createPage({
            path: `/s/${post.node.contentful_id}/`,
            component: blogPost,
            context: {
              slug: post.node.slug
            },
          })
        })

        // Tag Pages
        let tags = []
        // Iterate through each post, putting all found tags into `tags`
        _.each(posts, edge => {
          if (_.get(edge, "node.tags")) {
            tags = tags.concat(edge.node.tags)
          }
        })
        // Eliminate duplicate tags
        tags = _.uniq(tags)
        
        tags.forEach(tag => {
          createPage({
            path: `/tags/${tag}/`,
            component: tagTemplate,
            context: {
              tag
            },
          })
        })
      })
    )
  })
}
