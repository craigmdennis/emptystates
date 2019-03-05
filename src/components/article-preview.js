import React from 'react'
import { Link } from 'gatsby'
import Images from './images'

import styles from './article-preview.module.css'

export default ({ article }) => (
  <div className={styles.preview}>
    <Images images={article.images} />
    <h3 className={styles.previewTitle}>
      <Link to={`/${article.slug}`}>{article.title}</Link>
    </h3>
    <small>{article.publishDate}</small>
    {article.tags.map(tag => (
      <p className={styles.tag} key={tag}>
        {tag}
      </p>
    ))}
  </div>
)
