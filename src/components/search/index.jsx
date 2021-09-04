import algoliasearch from 'algoliasearch/lite';
import React, {
  createRef, useState, useMemo,
} from 'react';
import { InstantSearch, SearchBox } from 'react-instantsearch-dom';
import useClickOutside from './use-click-outside';
import SearchResult from './search-result';

import { container, result } from './search.module.css';

export default function Search({ indices }) {
  const rootRef = createRef();
  const [searchQuery, setSearchQuery] = useState();
  const [hasFocus, setFocus] = useState(false);
  const searchClient = useMemo(
    () => algoliasearch(
      process.env.GATSBY_ALGOLIA_APP_ID,
      process.env.GATSBY_ALGOLIA_SEARCH_KEY,
    ),
    [],
  );

  useClickOutside(rootRef, () => setFocus(false));

  return (
    <div className={container} ref={rootRef}>
      <InstantSearch
        refresh
        searchClient={searchClient}
        indexName={indices[0].name}
        onSearchStateChange={({ query }) => {
          setSearchQuery(query);
        }}
      >
        <SearchBox
          hasFocus={hasFocus}
          onFocus={() => setFocus(true)}
          searchAsYouType
          onSubmit={(event) => {
            event.preventDefault();
          }}
        />
        <SearchResult
          className={result}
          show={searchQuery && searchQuery.length > 0 && hasFocus}
          indices={indices}
        />
      </InstantSearch>
    </div>
  );
}
