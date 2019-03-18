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
      {tags.map((tag, index) => (
        <li key={tag}>
          <Link
            to={`/tags/${slugify(tag, slugifyConfig)}/`}
            className={styles.taglist__tag}
          >
            {tag}
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default TagList
