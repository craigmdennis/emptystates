import React from 'react'
import { Link } from 'gatsby'
import Img from 'gatsby-image'
import styles from './preview.module.css'

class Preview extends React.Component {
  render() {
    const { contentful_id, image } = this.props.post

    return (
      <div className={styles.preview}>
        <Link to={`/s/${contentful_id}`} className={styles.link}>
          <Img alt={image.alt} fluid={image.fluid} key={image} />
        </Link>
      </div>
    )
  }
}

export default Preview
