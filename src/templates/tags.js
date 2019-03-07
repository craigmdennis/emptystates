import React from 'react'
import { Link, graphql } from 'gatsby'
import Helmet from 'react-helmet'
import Layout from "../components/layout"
import Preview from '../components/preview'
import Gallery from '../components/gallery'

// Todo: Refactor as functional component
class Tags extends React.Component {
  render() {
    const { siteTitle } = this.props.data.site.siteMetadata
    const { tag } = this.props.pageContext
    const { edges, totalCount } = this.props.data.allContentfulPost
    const tagHeader = `${totalCount} post${
      totalCount === 1 ? "" : "s"
    } tagged with "${tag}"`
  

    return (
      <Layout location={this.props.location} >
        <Helmet title={`${tagHeader} | ${siteTitle}`} />
        <div className="wrapper">
          <h2 className="section-headline">{tagHeader}</h2>
          <Gallery>
            {edges.map(({ node }) => {
              return (
                <li>
                  <Preview post={node} />
                </li>
              )
            })}
          </Gallery>
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
          contentful_id
          publishDate(formatString: "MMMM Do, YYYY")
          images {
            fluid(maxWidth: 400) {
              ...GatsbyContentfulFluid_withWebp
            }
          }
        }
      }
    }
  }
`
