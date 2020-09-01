import React from 'react';
import { Link } from 'gatsby';
import PropTypes from 'prop-types';

const Pagination = ({ currentPage, numPages, pathbase = '' }) => (
  <nav className="pagination">
    {currentPage > 1 ? (
      <Link title="Go to previous page" to={`${pathbase}/${currentPage - 1}`}>
        &larr; Previous
      </Link>
    ) : (
      <span />
    )}
    Page {currentPage} of {numPages}
    {currentPage < numPages ? (
      <Link title="Go to next page" to={`${pathbase}/${currentPage + 1}`}>
        Next &rarr;
      </Link>
    ) : (
      <span />
    )}
  </nav>
);

export default Pagination;

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  numPages: PropTypes.number.isRequired,
  pathbase: PropTypes.string,
};
