import React from 'react'
import { Link } from 'gatsby'
import styles from './taglist.module.css'

class TagList extends React.Component {
  render() {
    const { tags } = this.props

    return (
      <ul className={styles.taglist}>
        {tags.map(tag => (
          <li>
            <Link
              to={`/tags/${tag}`}
              className={styles.taglist__tag}
              key={tag}>{tag}
            </Link>
          </li>
        ))}
      </ul>
    )
  }
}

export default TagList
