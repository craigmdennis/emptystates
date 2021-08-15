import * as React from 'react'
import { Link, useStaticQuery, graphql } from 'gatsby'
import Search from "./search"
import {
  container,
  heading,
  navLinks,
  navLinkItem,
  navLinkText
} from './layout.module.css'

const searchIndices = [{ name: `prod_EmptyStates`, title: `States` }]

const Layout = ({ pageTitle, children }) => {
  const data = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          title
        }
      }
    }
  `)
  return (
    <div className={container}>
      <title>{pageTitle} | {data.site.siteMetadata.title}</title>
      <header>{data.site.siteMetadata.title}</header>
      <nav>
        <ul className={navLinks}>
          <li className={navLinkItem}><Link to="/" className={navLinkText}>Home</Link></li>
          <li className={navLinkItem}><Link to="/submit/" className={navLinkText}>Submit</Link></li>
        </ul>
        <Search indices={searchIndices} />
        <ul className={navLinks}>
          <li className={navLinkItem}><Link to="#" className={navLinkText}>Create an account</Link></li>
          <li className={navLinkItem}><Link to="#" className={navLinkText}>Log in</Link></li>
        </ul>
      </nav>
      <main>
        <h1 className={heading}>{pageTitle}</h1>
        {children}
      </main>
    </div>
  )
}

export default Layout