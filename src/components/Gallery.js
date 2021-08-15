import * as React from 'react'
import { Link } from 'gatsby'
import { GatsbyImage } from 'gatsby-plugin-image'

import {
  grid,
} from '../components/gallery.module.css'

const Gallery = ({nodes}) => {
  return (
    <div className={grid}>
      {
        nodes.map((node) => (
          <Link key={node.id} to={`states/${node.slug}/`}>
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
  )
}

export default Gallery;