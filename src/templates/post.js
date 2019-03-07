import React from 'react'
import { graphql } from 'gatsby'
import Helmet from 'react-helmet'
import Img from 'gatsby-image'
import Layout from '../components/layout'
import TagList from '../components/taglist'

class PostTemplate extends React.Component {
  render() {
    const post = this.props.data.contentfulPost
    const { siteTitle } = this.props.data.site.siteMetadata

    return (
      <Layout location={this.props.location} >
        <Helmet title={`${post.title} | ${siteTitle}`} />
        <div className="wrapper">
          <h1 className="section-headline">{post.title}</h1>
          <Img fixed={post.images[0].fixed} key={post.images[0]} />
          <div><small>{post.publishDate}</small></div>
          <TagList tags={post.tags} />
        </div>
      </Layout>
    )
  }
}

export default PostTemplate

export const pageQuery = graphql`
  query BlogPostByContentfulID($id: String!) {
    site {
      siteMetadata {
        title
      }
    }
    contentfulPost(contentful_id: { eq: $id }) {
      title
      tags
      publishDate(formatString: "MMMM Do, YYYY")
      images {
        fixed(width: 500) {
          ...GatsbyContentfulFixed_withWebp
        }
      }
    }
  }
`
