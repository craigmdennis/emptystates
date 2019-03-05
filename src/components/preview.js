import React from 'react'
import { Link } from 'gatsby'
import ImageList from './images'
import TagList from './taglist'

import styles from './preview.module.css'

export default ({ post }) => (
  <div className={styles.preview}>
    <h3 className={styles.preview__title}>{post.title}</h3>
    <Link to={`/s/${post.contentful_id}`} className={styles.preview__imageLink}>
      <ImageList images={post.images} className={styles.preview__imageThumb} />
    </Link>
    <div><small>{post.publishDate}</small></div>
    <TagList tags={post.tags} />
  </div>
)
