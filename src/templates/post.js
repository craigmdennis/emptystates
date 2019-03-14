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
    const classes = _.indexOf(lowerCaseTags, 'desktop')
      ? styles.item
      : styles.itemWide

    return (
      <Layout location={this.props.location}>
        <Helmet title={`${post.title} | ${title}`} />
        <Header title={post.title} />
        <Img fluid={post.image.fluid} key={post.image} className={classes} />
        {post.description && <p>{post.description}</p>}
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
      publishDate(formatString: "MMMM Do, YYYY")
      image {
        fluid(maxWidth: 1280) {
          ...GatsbyContentfulFluid_withWebp
        }
      }
    }
  }
`
