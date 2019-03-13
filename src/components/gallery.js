import * as React from 'react'
import Masonry from 'react-masonry-component'
import Preview from '../components/preview'
import styles from './gallery.module.css'

class Gallery extends React.Component {
  render() {
    const childElements = this.props.elements.map(({ node }) => {
      const classes = this.props.wide ? styles.wide : styles.item

      return (
        <div className={classes}>
          <Preview post={node} />
        </div>
      )
    })

    return (
      <Masonry className={styles.gallery} elementType={'div'}>
        {childElements}
      </Masonry>
    )
  }
}

export default Gallery
