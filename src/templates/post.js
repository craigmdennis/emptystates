import React from 'react'
import { graphql } from 'gatsby'
import Helmet from 'react-helmet'
import get from 'lodash/get'
import Layout from '../components/layout'
import Images from '../components/images'
import TagList from '../components/taglist'

class BlogPostTemplate extends React.Component {
  render() {
    const post = get(this.props, 'data.contentfulPost')
    const siteTitle = get(this.props, 'data.site.siteMetadata.title')

    return (
      <Layout location={this.props.location} >
        <Helmet title={`${post.title} | ${siteTitle}`} />
        <div className="wrapper">
          <h1 className="section-headline">{post.title}</h1>
          <Images images={post.images} />
          <div><small>{post.publishDate}</small></div>
          <TagList tags={post.tags} />
        </div>
      </Layout>
    )
  }
}

export default BlogPostTemplate

export const pageQuery = graphql`
  query BlogPostBySlug($slug: String!) {
    site {
      siteMetadata {
        title
      }
    }
    contentfulPost(slug: { eq: $slug }) {
      title
      tags
      publishDate(formatString: "MMMM Do, YYYY")
      images {
        fixed(width: 400) {
          ...GatsbyContentfulFixed_withWebp
        }
      }
    }
  }
`
