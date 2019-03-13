import React from 'react'
import { Link } from 'gatsby'
import slugify from 'slugify'
import styles from './taglist.module.css'

const TagList = ({ tags }) => {
  const slugifyConfig = {
    lower: true,
  }

  return (
    <ul className={styles.taglist}>
      {tags.map(tag => (
        <li>
          <Link
            to={`/tags/${slugify(tag, slugifyConfig)}/`}
            className={styles.taglist__tag}
            key={tag}
          >
            {tag}
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default TagList
