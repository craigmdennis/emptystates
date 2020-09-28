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
  const isFirst = currentPage === 1;
  const isLast = currentPage === numPages;
  const pages = Array.from({ length: numPages }, (_, i) => i + 1);

  const previousLink =
    currentPage === 1 ? `/${basePath}` : `/${basePath}${currentPage - 1}/`;

  const nextLink =
    currentPage === numPages
      ? `/${basePath}`
      : `/${basePath}${currentPage + 1}/`;

  return (
    <nav className={styles.paginaton}>
      <PaginationButton
        type={isFirst ? 'span' : 'link'}
        to={previousLink}
        key="pagination-previous"
      >
        <ChevrontLeft className={styles.icon} />
        <span className="visually-hidden">Previous Page</span>
      </PaginationButton>

      {pages.map((pageNumber, index) => {
        const midPageLink =
          index === 0 ? `/${basePath}` : `/${basePath}${index + 1}/`;

        return (
          <PaginationButton
            key={`pagination-${index}`}
            to={midPageLink}
            type={index + 1 === currentPage ? 'span' : 'link'}
          >
            {pageNumber}
          </PaginationButton>
        );
      })}

      <PaginationButton
        type={currentPage === numPages ? 'span' : 'link'}
        to={nextLink}
        key="pagination-next"
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
