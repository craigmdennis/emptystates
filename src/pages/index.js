import PropTypes from "prop-types"
import React from "react"
import { Link, graphql } from "gatsby"
import Helmet from "react-helmet"
import Layout from "../components/layout"
import Header from "../components/header"

const IndexPage = ({
  data: {
    allMarkdownRemark: { edges },
  },
}) => {
  const PostLink = ({ post }) => {
    console.log(post)
    return (
      <Link to={post.fields.slug}>
        {post.frontmatter.title} ({post.frontmatter.date})
      </Link>
    )
  }

  const Posts = edges
    .filter(edge => !!edge.node.frontmatter.date) // You can filter your posts based on some criteria
    .map(edge => <PostLink key={edge.node.id} post={edge.node} />)
  return <Layout>{Posts}</Layout>
}

Header.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
}

export default IndexPage

export const pageQuery = graphql`
  query {
    allMarkdownRemark(sort: { order: DESC, fields: [frontmatter___date] }) {
      edges {
        node {
          fields {
            slug
          }
          id
          excerpt(pruneLength: 250)
          frontmatter {
            date(formatString: "MMMM DD, YYYY")
            title
          }
        }
      }
    }
  }
`
