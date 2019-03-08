import React from 'react'
import { graphql } from 'gatsby'
import Helmet from 'react-helmet'
import Layout from "../components/layout"
import _ from 'lodash'
import Gallery from '../components/gallery'
import Pluralize from 'react-pluralize'

// Todo: Refactor as functional component
class Tags extends React.Component {
  render() {
    const { siteTitle } = this.props.data.site.siteMetadata
    const { tag } = this.props.pageContext
    const { edges, totalCount } = this.props.data.allContentfulPost
    const tagHeader = {
      singular: `There is only one ${tag} Empty State`,
      plural: `There are ${totalCount} ${tag} Empty States`
    }
    const title = totalCount === 1 ? tagHeader.singular : tagHeader.plural
    const wide = tag === 'desktop' ? true : false
  

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
