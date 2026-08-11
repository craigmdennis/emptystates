CREATE TABLE states (
  id               TEXT PRIMARY KEY,          -- ULID, sorts by creation time
  slug             TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  -- Nullable on purpose. Only 57 of 235 legacy entries carry a `product`
  -- field, and titles do not rescue the rest. "App name is required" is a
  -- submission rule enforced in application code, not a fact about every row
  -- that has ever existed. Backfilled later by the vision model.
  app_name         TEXT,
  app_url          TEXT,

  device_type      TEXT NOT NULL REFERENCES device_types(slug),
  -- Nullable for the same reason as app_name. 153 of the 252 legacy entries
  -- carry no OS tag, and 134 of those are phones -- defaulting them to 'web'
  -- would put 134 wrong answers behind the OS filter and in search on day one.
  -- Device type survives being NOT NULL because aspect ratio always recovers
  -- it; nothing in a screenshot's dimensions recovers its OS. Backfilled later
  -- by the vision model, and required of new submissions in application code.
  os               TEXT REFERENCES operating_systems(slug),

  r2_key           TEXT NOT NULL,
  width            INTEGER NOT NULL,
  height           INTEGER NOT NULL,
  aspect_ratio     REAL NOT NULL,             -- denormalised: layout needs it per row
  byte_size        INTEGER NOT NULL,          -- original's size, shown on the detail link

  screen_text      TEXT,                      -- Workers AI vision, not OCR
  description      TEXT,                      -- Workers AI vision
  color_names      TEXT,                      -- 'navy blue dark cool', for FTS

  status           TEXT NOT NULL DEFAULT 'published'
                     CHECK (status IN ('published','draft')),
  is_legacy        INTEGER NOT NULL DEFAULT 0,
  submitter_name   TEXT,
  submitter_handle TEXT,

  captured_at      TEXT,
  published_at     TEXT NOT NULL,
  created_at       TEXT NOT NULL
);

CREATE INDEX idx_states_browse ON states (status, published_at DESC);
CREATE INDEX idx_states_device ON states (status, device_type);
CREATE INDEX idx_states_os     ON states (status, os);
CREATE INDEX idx_states_aspect ON states (status, aspect_ratio);
