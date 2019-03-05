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
        <Helmet title={title} />
        <div className="wrapper">
          <h2 className="section-headline">{tagHeader}</h2>
          <ul className="article-list">
            {edges.map(({ node }) => {
              return (
                <li>
                  <ArticlePreview article={node} />
                </li>
              )
            })}
          </ul>
        </div>
      </Layout>
    )
  }
}

export default Tags

export const pageQuery = graphql`
  query TagQuery($tag: String) {
    site {
      siteMetadata {
        title
      }
    }
    allContentfulPost(
      sort: { fields: [publishDate], order: DESC }
      filter: { tags: { in: [$tag] } } ) {
      totalCount
      edges {
        node {
          title
          tags
          publishDate(formatString: "MMMM Do, YYYY")
          images {
            fixed(width: 200) {
              ...GatsbyContentfulFixed_withWebp
            }
          }
        }
      }
    }
  }
`
