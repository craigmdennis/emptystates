CREATE TABLE state_tags (
  state_id TEXT NOT NULL REFERENCES states(id) ON DELETE CASCADE,
  tag_id   INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (state_id, tag_id)
);
CREATE INDEX idx_state_tags_tag ON state_tags (tag_id, state_id);

-- Colour is stored twice on purpose: `bucket` is a name, indexed for the swatch
-- filter and copied into states.color_names so typing "blue" works. l/a/b are
-- CIELAB coordinates for distance ranking, because RGB distance judges colour
-- badly and CIELAB approximates how eyes compare it.
CREATE TABLE state_colors (
  state_id TEXT NOT NULL REFERENCES states(id) ON DELETE CASCADE,
  rank     INTEGER NOT NULL,        -- 1..5 by descending coverage
  hex      TEXT NOT NULL,
  l        REAL NOT NULL,
  a        REAL NOT NULL,
  b        REAL NOT NULL,
  coverage REAL NOT NULL,           -- 0..1 share of pixels
  bucket   TEXT NOT NULL,
  PRIMARY KEY (state_id, rank)
);
CREATE INDEX idx_colors_bucket ON state_colors (bucket, state_id);

-- Hand-curated links between related empty states, carried over from the
-- legacy `related` frontmatter key on 18 entries. Stored by id, resolved from
-- titles during import; anything that fails to resolve is reported, never
-- guessed. Directed, because A relating to B did not always mean the reverse.
CREATE TABLE state_relations (
  state_id         TEXT NOT NULL REFERENCES states(id) ON DELETE CASCADE,
  related_state_id TEXT NOT NULL REFERENCES states(id) ON DELETE CASCADE,
  PRIMARY KEY (state_id, related_state_id),
  CHECK (state_id <> related_state_id)
);
CREATE INDEX idx_relations_related ON state_relations (related_state_id);
