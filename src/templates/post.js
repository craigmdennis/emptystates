import React from 'react'
import { graphql } from 'gatsby'
import Helmet from 'react-helmet'
import Img from 'gatsby-image'
import _ from 'lodash'
import Header from '../components/header'
import Layout from '../components/layout'
import TagList from '../components/taglist'
import styles from './post.module.css'

class PostTemplate extends React.Component {
  render() {
    const post = this.props.data.contentfulEmptyState
    const { title } = this.props.data.site.siteMetadata
    const lowerCaseTags = post.tags.map(tag => tag.toLowerCase())
    const classes = node.tags.includes('Desktop') ? styles.wide : styles.item

    return (
      <Layout location={this.props.location}>
        <Helmet title={`${post.title} | ${title}`} />
        <Header title={post.title} />
        {post.description && <p>{post.description}</p>}
        <Img fluid={post.image.fluid} className={classes} />
        <div>
          <small>{post.publishDate}</small>
        </div>
        <TagList tags={post.tags} />
      </Layout>
    )
  }
}

export default PostTemplate

export const pageQuery = graphql`
  query EmptyStateByContentfulID($id: String!) {
    site {
      siteMetadata {
        title
      }
    }
    contentfulEmptyState(contentful_id: { eq: $id }) {
      title
      url
      tags
      description
      publishDate(formatString: "MMMM Do, YYYY")
      image {
        fluid(maxWidth: 1280) {
          ...GatsbyContentfulFluid_withWebp
        }
      }
    }
  }
`
