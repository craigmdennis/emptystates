CREATE TABLE submissions (
  id                  TEXT PRIMARY KEY,
  status              TEXT NOT NULL
                        CHECK (status IN ('queued','pending','auto_rejected','approved','rejected')),
  source              TEXT NOT NULL CHECK (source IN ('public','admin','backfill')),

  r2_key              TEXT NOT NULL,
  width               INTEGER,
  height              INTEGER,
  aspect_ratio        REAL,
  has_alpha           INTEGER,
  byte_size           INTEGER,

  title               TEXT,
  app_name            TEXT,
  app_url             TEXT,
  device_type         TEXT,
  device_type_other   TEXT,
  os                  TEXT,
  os_other            TEXT,
  tags_json           TEXT,

  screen_text         TEXT,
  description         TEXT,
  colors_json         TEXT,
  suggested_tags_json TEXT,

  submitter_name      TEXT,
  submitter_handle    TEXT,

  checks_json         TEXT,
  agent_verdict       TEXT,
  agent_reason        TEXT,
  agent_confidence    REAL,
  duplicate_of        TEXT REFERENCES states(id),

  created_at          TEXT NOT NULL,
  reviewed_at         TEXT,
  published_state_id  TEXT REFERENCES states(id)
);

CREATE INDEX idx_submissions_queue ON submissions (status, created_at DESC);
