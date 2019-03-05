import React from 'react'
import Img from 'gatsby-image'

class Images extends React.Component {
  render() {
    const { images } = this.props

    return (
      <div>
        {images.map(image => (
          <Img alt={image.alt} fluid={image.fluid} key={image} />
        ))}
      </div>
    )
  }
}

export default Images
