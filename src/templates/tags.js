import React from 'react'
import { graphql } from 'gatsby'
import Helmet from 'react-helmet'
import Layout from "../components/layout"
import _ from 'lodash'
import Gallery from '../components/gallery'

// Todo: Refactor as functional component
class Tags extends React.Component {
  render() {
    const { siteTitle } = this.props.data.site.siteMetadata
    const { tag } = this.props.pageContext
    const { edges, totalCount } = this.props.data.allContentfulPost
    const title = `${tag} Empty States`
    const wide = tag.toLowerCase() === 'desktop' ? true : false
  

    return (
      <Layout location={this.props.location} >
        <Helmet title={`${title} | ${siteTitle}`} />
        <h2>{title}</h2>
        <Gallery elements={edges} wide={wide} />
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
      sort: { fields: [publishDate], order: ASC }
      filter: { tags: { in: [$tag] } } ) {
      totalCount
      edges {
        node {
          title
          tags
          contentful_id
          publishDate(formatString: "MMMM Do, YYYY")
          images {
            fluid(maxWidth: 800) {
              ...GatsbyContentfulFluid_withWebp
            }
          }
        }
      }
    }
  }
`
