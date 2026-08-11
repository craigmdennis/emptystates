-- Legacy inbound paths that must keep resolving.
--
-- 34 of the 235 legacy entries carry a `redirect` frontmatter key holding the
-- Tumblr URL the entry lived at before this site existed, e.g.
-- /post/162083631161/no-assignments-designed-by-meneghiniem. Gatsby serves
-- those today. Neither the architecture spec nor the foundation plan gave them
-- a home, so importing without this table would 404 every one of them.
--
-- A table rather than a static redirect list because submissions and the admin
-- agent can retire a slug later, and the redirect then has to follow the state
-- rather than a file nobody remembers to edit.
CREATE TABLE state_redirects (
  -- Path only: leading slash, no scheme, host, query or fragment. Primary key
  -- because one inbound path cannot honestly resolve to two different states.
  from_path  TEXT PRIMARY KEY,
  state_id   TEXT NOT NULL REFERENCES states(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_redirects_state ON state_redirects (state_id);
