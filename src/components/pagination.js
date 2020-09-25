import React, { Fragment } from 'react';
import { Link } from 'gatsby';
import PropTypes from 'prop-types';
import styles from '../styles/pagination.module.css';
import ChevrontLeft from '../images/icon-chevron-left.svg';
import ChevrontRight from '../images/icon-chevron-right.svg';

const Pagination = ({ currentPage, numPages, pathbase = '' }) => {
  const Nav = ({ numPages, currentPage }) => {
    let buttons = [];

    for (let i = 0; i < numPages; i++) {
      const pageNumber = i + 1;
      buttons.push(
        <PaginationButton
          key={pageNumber}
          pageNumber={pageNumber}
          isCurrent={pageNumber === currentPage ? true : false}
        >
          {pageNumber}
        </PaginationButton>
      );
    }

    return buttons;
  };

  const PaginationButton = ({ pageNumber, isCurrent, children }) => {
    const pageLink = pageNumber === 1 ? '' : pageNumber;

    if (isCurrent) {
      return (
        <span className={styles.paginationButtonActive}>{pageNumber}</span>
      );
    } else {
      return (
        <Link
          className={styles.paginationButtonEnabled}
          to={`${pathbase}/${pageLink}`}
        >
          {children}
        </Link>
      );
    }
  };

  return (
    <nav className={styles.paginaton}>
      <Nav numPages={numPages} currentPage={currentPage} />
    </nav>
  );
};

export default Pagination;

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  numPages: PropTypes.number.isRequired,
  pathbase: PropTypes.string,
};
