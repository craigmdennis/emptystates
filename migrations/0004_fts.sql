-- Standalone, not content=-backed: external-content FTS5 requires every indexed
-- column to exist on the content table, and tags and colours live in join
-- tables. The application rewrites this row on any write to states, state_tags
-- or state_colors, in the same batch.
CREATE VIRTUAL TABLE states_fts USING fts5(
  title,
  app_name,
  tags,
  colors,
  screen_text,
  description,
  state_id UNINDEXED,
  tokenize = 'porter unicode61'
);
