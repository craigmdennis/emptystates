import * as React from "react"
import { Link, graphql } from "gatsby"
import { GatsbyImage } from 'gatsby-plugin-image'
import Layout from '../components/layout'

// CHANGE THIS
import {
  grid,
  article
} from '../components/layout.module.css'

const IndexPage = ({ data }) => {
  return (
    <Layout pageTitle="Empty States">
      <h1>Find inspiration for your empty states.</h1>
      <p>Browse or search for designs demonstrating how others handle an empty screen.</p>
      <Link to="/submit/">Submit your own</Link>

      <div className={grid}>
        {
          data.allMdx.nodes.map((node) => (
            <Link key={node.id} to={`states/${node.slug}`} className={article}>
              <GatsbyImage
                alt=""
                image={node.frontmatter.image.childImageSharp.gatsbyImageData}
              />
              <h2>{node.frontmatter.title}</h2>
              <p>Posted: {node.frontmatter.date}</p>
            </Link>
          ))
        }
      </div>
    </Layout>
  )
}

export const query = graphql`
  query StatesQuery {
    allMdx(sort: {fields: frontmatter___date, order: DESC}) {
      totalCount
      nodes {
        frontmatter {
          date(formatString: "MMMM D, YYYY")
          title
          image {
            childImageSharp {
              gatsbyImageData(layout:CONSTRAINED, width: 400, height:300)
            }
          }
          product
          tags
        }
        slug
        id
        body
      }
    }
  }
`

export default IndexPage
