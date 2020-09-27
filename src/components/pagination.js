import React from 'react';
import { Link } from 'gatsby';
import PropTypes from 'prop-types';
import styles from '../styles/pagination.module.css';
import ChevrontLeft from '../images/icon-chevron-left.svg';
import ChevrontRight from '../images/icon-chevron-right.svg';

const PaginationButton = (props) => {
  const { type, children } = props;
  if (type === 'span') {
    return (
      <span className={styles.paginationButton} {...props}>
        {children}
      </span>
    );
  } else {
    return (
      <Link className={styles.paginationButtonEnabled} {...props}>
        {children}
      </Link>
    );
  }
};

PaginationButton.propTypes = {
  type: PropTypes.oneOf(['link', 'span']),
  children: PropTypes.node.isRequired,
};

const Pagination = ({ currentPage, numPages, basePath = '' }) => {
  let buttons = [];

  const pages = Array.from({ length: numPages }, (_, i) => i + 1);

  const previousLink = `${basePath}/${
    currentPage === 2 ? '' : currentPage - 1 + '/'
  }`;

  const nextLink = `${basePath}/${
    currentPage === numPages ? '' : currentPage + 1 + '/'
  }/`;

  return (
    <nav className={styles.paginaton}>
      <PaginationButton
        type={currentPage === 1 ? 'span' : 'link'}
        to={previousLink}
        key="prev"
      >
        <ChevrontLeft className={styles.icon} />
        <span className="visually-hidden">Previous Page</span>
      </PaginationButton>

      {/* Get the total number of pages
      if more than 5
      get the first first page,
      the page before the current page,
      the page after the current page,
      and the last page */}
      {pages.map((pageNumber, index) => {
        const midPageLink =
          pageNumber === 1 ? `${basePath}` : `${basePath}/${pageNumber}/`;

        return (
          <PaginationButton
            key={index}
            to={midPageLink}
            type={pageNumber === currentPage ? 'span' : 'link'}
          >
            {pageNumber}
          </PaginationButton>
        );
      })}

      <PaginationButton
        type={currentPage === numPages ? 'span' : 'link'}
        to={nextLink}
        key="next"
      >
        <ChevrontRight className={styles.icon} />
        <span className="visually-hidden">Next Page</span>
      </PaginationButton>
    </nav>
  );
};

export default Pagination;

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  numPages: PropTypes.number.isRequired,
  basePath: PropTypes.string,
};
