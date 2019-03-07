import React from 'react'
import { Link } from 'gatsby'
import ImageList from './imagelist'
import TagList from './taglist'

import styles from './preview.module.css'

class Preview extends React.Component {
  render() {
    const { post } = this.props

    return (    
      <div className={styles.preview}>
        <Link to={`/s/${post.contentful_id}`} className={styles.preview__imageLink}>
          <ImageList images={post.images} className={styles.preview__imageThumb} />
          <h3 className={styles.preview__title}>{post.title}</h3>
        </Link>
        <small>{post.publishDate}</small>
        <TagList tags={post.tags} />
      </div>
    )
  }
}

export default Preview