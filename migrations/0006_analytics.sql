-- A curation tool, not analytics: the zero-result list tells you which empty
-- states people want and you do not have. No IP, no user agent, no session id.
CREATE TABLE search_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  query       TEXT NOT NULL,
  results     INTEGER NOT NULL,
  facets_json TEXT,
  created_at  TEXT NOT NULL
);
CREATE INDEX idx_search_zero ON search_log (results, created_at DESC);

-- A counter, not an event log: a toggle costs one UPDATE rather than one
-- INSERT. Per-event detail lives in Plausible.
CREATE TABLE layout_prefs (
  view TEXT NOT NULL,        -- justified | square
  day  TEXT NOT NULL,        -- YYYY-MM-DD
  n    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (view, day)
);
