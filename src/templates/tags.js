import React from 'react'
import { Link, graphql } from 'gatsby'
import Helmet from 'react-helmet'
import Layout from "../components/layout"
import ArticlePreview from '../components/article-preview'

// Todo: Refactor as functional component
class Tags extends React.Component {
  render() {
    const { title } = this.props.data.site.siteMetadata
    const { tag } = this.props.pageContext
    const { edges, totalCount } = this.props.data.allContentfulPost
    const tagHeader = `${totalCount} post${
      totalCount === 1 ? "" : "s"
    } tagged with "${tag}"`
  

    return (
      <Layout location={this.props.location} >
        <div>
          <Helmet title={title} />
          <div className="wrapper">
            <h2 className="section-headline">{tagHeader}</h2>
            <ul className="article-list">
              {edges.map(({ node }) => {
                return (
                  <li key={node.slug}>
                    <ArticlePreview article={node} />
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </Layout>
    )
  }
}

export default Tags

export const pageQuery = graphql`
  query TagQuery {
    site {
      siteMetadata {
        title
      }
    }
    allContentfulPost(
      sort: { fields: [publishDate], order: DESC }) {
      totalCount
      edges {
        node {
          title
          slug
          publishDate(formatString: "MMMM Do, YYYY")
          tags
          images {
            fluid(maxWidth: 350, resizingBehavior: SCALE) {
              ...GatsbyContentfulFluid_tracedSVG
            }
          }
        }
      }
    }
  }
`
