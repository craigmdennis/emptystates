import React from 'react'
import { Link } from 'gatsby'
import Images from './images'

import styles from './article-preview.module.css'

export default ({ article }) => (
  <div className={styles.preview}>
    <h3 className={styles.preview__title}>{article.title}</h3>
    <Link to={`/s/${article.contentful_id}`} className={styles.preview__imageLink}>
      <Images images={article.images} className={styles.preview__imageThumb} />
    </Link>
    <div>{article.publishDate}</div>
    {article.tags.map(tag => (
      <Link
        to={`/tags/${tag}`}
        className={styles.preview__imageLink}
        key={tag}>{tag}
      </Link>
    ))}
  </div>
)
