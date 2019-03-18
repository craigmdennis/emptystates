import React from 'react'
import { useStaticQuery, graphql } from 'gatsby'
import Helmet from 'react-helmet'
import Layout from '../components/layout'
import Gallery from '../components/gallery'
import Header from '../components/header'
import { Location } from '@reach/router'

const Index = ({ location }) => {
  const data = useStaticQuery(graphql`
    query IndexQuery {
      site {
        siteMetadata {
          homepage {
            title
          }
          title
          description
        }
      }
      allContentfulEmptyState(sort: { fields: [publishDate], order: DESC }) {
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
  `)

  const { title, description, homepage } = data.site.siteMetadata
  const posts = data.allContentfulEmptyState.edges

  return (
    <Layout>
      <Helmet title={title} />
      <Header title={homepage.title} description={description} />
      <Gallery elements={posts} />
    </Layout>
  )
}

export default Index
