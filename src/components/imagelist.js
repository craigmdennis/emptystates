import React from 'react'
import Img from 'gatsby-image'

class ImageList extends React.Component {
  render() {
    const { images } = this.props

    return (
      <React.Fragment>
        {images.map(image => (
          <Img alt={image.alt} fluid={image.fluid} key={image} />
        ))}
      </React.Fragment>
    )
  }
}

export default ImageList
