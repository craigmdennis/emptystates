import React from 'react'
import { graphql } from 'gatsby'
import Helmet from 'react-helmet'
import _ from 'lodash'
import Layout from '../components/layout'
import Gallery from '../components/gallery'
import Header from '../components/header'

// Todo: Refactor as functional component
class Tags extends React.Component {
  render() {
    const siteTitle = this.props.data.site.siteMetadata.title
    const { tag } = this.props.pageContext
    const { edges } = this.props.data.allContentfulPost
    const title = tag
    const wide = tag.toLowerCase() === 'desktop' ? true : false

    return (
      <Layout location={this.props.location}>
        <Helmet title={`${title} | ${siteTitle}`} />
        <Header title={title} />
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
    allContentfulStates(
      sort: { fields: [publishDate], order: ASC }
      filter: { tags: { in: [$tag] } }
    ) {
      totalCount
      edges {
        node {
          title
          tags
          contentful_id
          publishDate(formatString: "MMMM Do, YYYY")
          image {
            fluid(maxWidth: 800) {
              ...GatsbyContentfulFluid_withWebp
            }
          }
        }
      }
    }
  }
`
