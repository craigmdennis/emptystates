import React from 'react'
import { Link, graphql } from 'gatsby'
import get from 'lodash/get'
import Helmet from 'react-helmet'
import Layout from "../components/layout"
import Preview from '../components/preview'

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
            <ul className="post-list">
              {posts.map(({ node }) => {
                return (
                  <li>
                    <Preview post={node} />
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
            fixed(width: 200) {
              ...GatsbyContentfulFixed_withWebp
            }
          }
        }
      }
    }
  }
`
