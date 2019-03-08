import React from 'react'
import { graphql } from 'gatsby'
import get from 'lodash/get'
import Helmet from 'react-helmet'
import Layout from "../components/layout"
import Gallery from '../components/gallery'

// Refactor info functional component
class Index extends React.Component {
  render() {
    const siteTitle = get(this, 'props.data.site.siteMetadata.title')
    const posts = get(this, 'props.data.allContentfulPost.edges')

    return (
      <Layout location={this.props.location} >
        <Helmet title={siteTitle} />
        <h2>Latest Empty States</h2>
        <Gallery elements={posts} />
      </Layout>
    )
  }
}

export default Index

export const pageQuery = graphql`
  query IndexQuery {
    site {
      siteMetadata {
        title
      }
    }
    allContentfulPost(sort: { fields: [publishDate], order: ASC }) {
      edges {
        node {
          title
          publishDate(formatString: "MMMM Do, YYYY")
          tags
          contentful_id
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
