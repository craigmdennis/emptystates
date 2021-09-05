import * as React from 'react';
import { Helmet } from 'react-helmet';
import { Link, useStaticQuery, graphql } from 'gatsby';
import Search from './search';
import {
  container,
  navLinks,
  navLinkItem,
  navLinkText,
  nav,
} from './layout.module.css';

const searchIndices = [{ name: 'dev_EmptyStates', title: 'States' }];

const Layout = ({ pageTitle, children }) => {
  // This should probbaly use the same siteTitle as a node on every page?
  const data = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          title
        }
      }
    }
  `);

  const { title } = data.site.siteMetadata;
  return (
    <div className={container}>
      <Helmet>
        <title>{title}</title>
      </Helmet>

      <nav className={nav}>
        <ul className={navLinks}>
          <li className={navLinkItem}>
            <Link to="/" className={navLinkText}>
              {title}
            </Link>
          </li>
        </ul>

        <Search indices={searchIndices} />

        <ul className={navLinks}>
          <li className={navLinkItem}>
            <Link to="/submit/" className={navLinkText}>
              Submit
            </Link>
          </li>
          <li className={navLinkItem}>
            <Link to="#" className={navLinkText}>
              Create an account
            </Link>
          </li>
          <li className={navLinkItem}>
            <Link to="#" className={navLinkText}>
              Log in
            </Link>
          </li>
        </ul>
      </nav>
      <h1>{pageTitle}</h1>
      <main>{children}</main>
    </div>
  );
};

export default Layout;
