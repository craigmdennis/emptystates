-- Taxonomies are tables, never CHECK enums: device types and operating systems
-- must grow without a schema migration.

CREATE TABLE device_types (
  slug       TEXT PRIMARY KEY,
  label      TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  is_active  INTEGER NOT NULL DEFAULT 1,
  min_ratio  REAL,
  max_ratio  REAL,
  created_at TEXT NOT NULL
);

-- Ranges overlap deliberately. They flag a claimed device that disagrees with
-- the image's actual shape for review; they never reject.
INSERT INTO device_types (slug,label,sort_order,is_active,min_ratio,max_ratio,created_at) VALUES
 ('phone','Phone',1,1,0.40,0.65,'2026-08-11T00:00:00Z'),
 ('tablet','Tablet',2,1,0.65,1.50,'2026-08-11T00:00:00Z'),
 ('desktop','Desktop',3,1,1.20,2.20,'2026-08-11T00:00:00Z'),
 ('tv','TV',4,1,1.50,2.40,'2026-08-11T00:00:00Z'),
 ('console','Game console',5,1,1.50,2.40,'2026-08-11T00:00:00Z'),
 ('watch','Watch',6,1,0.70,1.30,'2026-08-11T00:00:00Z');

CREATE TABLE operating_systems (
  slug       TEXT PRIMARY KEY,
  label      TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  is_active  INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

INSERT INTO operating_systems (slug,label,sort_order,is_active,created_at) VALUES
 ('ios','iOS',1,1,'2026-08-11T00:00:00Z'),
 ('android','Android',2,1,'2026-08-11T00:00:00Z'),
 ('web','Web',3,1,'2026-08-11T00:00:00Z'),
 ('macos','macOS',4,1,'2026-08-11T00:00:00Z'),
 ('windows','Windows',5,1,'2026-08-11T00:00:00Z'),
 ('linux','Linux',6,1,'2026-08-11T00:00:00Z');

CREATE TABLE tags (
  id    INTEGER PRIMARY KEY,
  slug  TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL
);
