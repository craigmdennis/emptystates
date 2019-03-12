import React from 'react'
import { graphql } from 'gatsby'
import Helmet from 'react-helmet'
import Layout from '../components/layout'
import Gallery from '../components/gallery'
import Header from '../components/header'

// Refactor info functional component
class Index extends React.Component {
  render() {
    const { title, description, homepage } = this.props.data.site.siteMetadata
    const posts = this.props.data.allContentfulPost.edges

    return (
      <Layout location={this.props.location}>
        <Helmet title={title} />
        <Header title={homepage.title} description={description} />
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
        homepage {
          title
        }
        description
      }
    }
    allContentfulPost(sort: { fields: [publishDate], order: ASC }) {
      edges {
        node {
          title
          publishDate(formatString: "MMMM Do, YYYY")
          tags
          contentful_id
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
