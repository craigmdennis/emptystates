import * as React from 'react'
import Layout from '../../components/layout'
import { Link, graphql } from "gatsby"
import { GatsbyImage } from 'gatsby-plugin-image'
import { MDXRenderer } from 'gatsby-plugin-mdx'

const State = ({ data }) => {
  return (
    <Layout pageTitle={data.mdx.frontmatter.title}>
      <GatsbyImage
        alt=""
        image={data.mdx.frontmatter.image.childImageSharp.gatsbyImageData}
      />
      <p>Posted: {data.mdx.frontmatter.date}</p>
      {data.mdx.body &&
        <MDXRenderer>
          {data.mdx.body}
        </MDXRenderer>
      }
    </Layout>
  )
}

export const query = graphql`
  query StateQuery($id: String) {
    mdx(id: {eq: $id}) {
      frontmatter {
        title
        date(formatString: "MMMM D, YYYY")
        image {
          childImageSharp {
            gatsbyImageData(width: 800)
          }
        }
        product
        tags
      }
      body
    }
  }
`

export default State