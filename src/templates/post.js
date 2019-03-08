import React from 'react'
import { graphql } from 'gatsby'
import Helmet from 'react-helmet'
import Img from 'gatsby-image'
import _ from 'lodash'
import Layout from '../components/layout'
import TagList from '../components/taglist'
import styles from './post.module.css'

class PostTemplate extends React.Component {
  render() {
    const post = this.props.data.contentfulPost
    const { siteTitle } = this.props.data.site.siteMetadata
    const lowerCaseTags = post.tags.map(tag => tag.toLowerCase())
    const classes =
      _.indexOf(lowerCaseTags, 'desktop')
      ? styles.item
      : styles.itemWide

    return (
      <Layout location={this.props.location} >
        <Helmet title={`${post.title} | ${siteTitle}`} />
        <h1>{post.title}</h1>
        <Img fluid={post.images[0].fluid} key={post.images[0]} className={classes} />
        {post.description && <p>{post.description}</p>}
        <div><small>{post.publishDate}</small></div>
        <TagList tags={post.tags} />
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
        fluid(maxWidth: 1200) {
          ...GatsbyContentfulFluid_withWebp
        }
      }
    }
  }
`
