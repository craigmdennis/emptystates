import React from 'react'
import Img from 'gatsby-image'

class ImageList extends React.Component {
  render() {
    const { images } = this.props

    return (
      <React.Fragment>
        {images.map(image => (
          <Img alt={image.alt} fixed={image.fixed} key={image} />
        ))}
      </React.Fragment>
    )
  }
}

export default ImageList
