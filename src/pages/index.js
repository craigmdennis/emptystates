import React from 'react'
import { Link, graphql } from 'gatsby'
import get from 'lodash/get'
import Helmet from 'react-helmet'
import Layout from "../components/layout"
import Preview from '../components/preview'
import Gallery from '../components/gallery'

// Refactor info functional component
class Index extends React.Component {
  render() {
    const siteTitle = get(this, 'props.data.site.siteMetadata.title')
    const posts = get(this, 'props.data.allContentfulPost.edges')

    return (
      <Layout location={this.props.location} >
        <div>
          <Helmet title={siteTitle} />
          <div className="wrapper">
            <h2 className="section-headline">Latest Empty States</h2>
            <Gallery>
              {posts.map(({ node }) => {
                return (
                  <li>
                    <Preview post={node} />
                  </li>
                )
              })}
            </Gallery>
          </div>
        </div>
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
    allContentfulPost(sort: { fields: [publishDate], order: DESC }) {
      edges {
        node {
          title
          publishDate(formatString: "MMMM Do, YYYY")
          tags
          contentful_id
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
