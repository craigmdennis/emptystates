import React from 'react';
import { Link } from 'gatsby';
import { GatsbyImage } from 'gatsby-plugin-image';
import {
  connectStateResults,
  Highlight,
  Hits,
  Index,
  Pagination,
} from 'react-instantsearch-dom';

import {
  media, body, image, grid,
} from './search.module.css';

const HitCount = connectStateResults(({ searchResults }) => {
  const hitCount = searchResults && searchResults.nbHits;

  return hitCount > 0 ? (
    <div className="HitCount">
      {`${hitCount} result${hitCount !== 1 ? 's' : ''}`}
    </div>
  ) : null;
});

const PageHit = ({ hit }) => (
  <Link to={`/s/${hit.slug}`} className={media}>
    <GatsbyImage
      alt=""
      image={hit.image.childImageSharp.gatsbyImageData}
      className={image}
    />
    <div className={body}>
      <h4>
        <Highlight attribute="title" hit={hit} tagName="mark" />
      </h4>
      <p>
        Posted:
        {hit.date}
      </p>
    </div>
  </Link>
);

const HitsInIndex = ({ index }) => (
  <Index indexName={index.name}>
    <HitCount />
    <Hits className="Hits" hitComponent={PageHit} className={grid} />
  </Index>
);

const SearchResult = ({ indices, show }) => (
  <div style={{ display: show ? 'block' : 'none' }}>
    {indices.map((index) => (
      <HitsInIndex index={index} key={index.name} />
    ))}

    <Pagination />
  </div>
);

export default SearchResult;
