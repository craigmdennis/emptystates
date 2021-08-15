const escapeStringRegexp = require("escape-string-regexp")

const pagePath = `content/states`
const indexName = `prod_EmptyStates`

const stateQuery = `{
  states: allMdx(
    filter: {
      fileAbsolutePath: { regex: "/${escapeStringRegexp(pagePath)}/" },
    }
  ) {
    edges {
      node {
        id
        frontmatter {
          title
          date
          image {
            childImageSharp {
              gatsbyImageData(width: 50)
            }
          }
          tags
          product
        }
        slug
        excerpt(pruneLength: 5000)
      }
    }
  }
}`

function pageToAlgoliaRecord({ node: { id, frontmatter, slug, ...rest } }) {
  return {
    objectID: id,
    ...frontmatter,
    slug,
    ...rest,
  }
}

const queries = [
  {
    query: stateQuery,
    transformer: ({ data }) => data.states.edges.map(pageToAlgoliaRecord),
    indexName,
    settings: { attributesToSnippet: [`excerpt:20`] },
  },
]

module.exports = queries