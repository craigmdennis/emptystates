# EmptyStates — Architecture

**Date:** 2026-08-10
**Status:** approved, ready for sub-specs
**Supersedes:** `2026-04-08-redesign-design.md` (EMDash approach, abandoned)

This is the umbrella document. It fixes the stack, the data model, the shared
conventions and the free-tier budget. Four sub-specs sit beneath it and inherit
everything here:

| # | Spec | Depends on |
|---|---|---|
| 01 | Foundation + gallery | — |
| 02 | Search + ingest | 01 |
| 03 | Submissions | 01, 02 |
| 04 | Admin + agent | 01, 02, 03 |

---

## Problem

`emptystat.es` is a curated gallery of 235+ empty-state screenshots. Three things
are missing and one is wrong.

Missing: a public submission route, an admin area optimised for review, and search
across the dimensions that actually matter — tags, screen text, app name, colour,
date, screen size, OS.

Wrong: the layout. The library spans a 7× range of aspect ratios, from 0.47 phone
portraits to 3.27 wide crops, and no grid built so far handles that mix without
either letterboxing the 77% of entries that are phones or burying the desktop
entries that most need the space.

## Goals

- One grid that presents phone, tablet and desktop honestly in a single view.
- Search across all six dimensions from a single free-text field, with facets on top.
- A public submission flow with enforceable content rules.
- An admin area optimised for mobile review and one-tap publishing.
- Everything inside Cloudflare's free tier.

## Non-goals

- Migrating the legacy Gatsby site's hosting. That shipped separately — see
  `2026-08-10-gatsby-cloudflare-migration-design.md`.
- Submitter accounts, logins, or profiles.
- Email notification to submitters. Deferred past v1.
- Auto-publishing without human review. See spec 04 for why this is phase two.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Astro 6, `output: "server"`, `@astrojs/cloudflare` |
| Runtime | Cloudflare Workers |
| Database | Cloudflare D1 (SQLite), including FTS5 |
| Object storage | Cloudflare R2, public bucket on `img.emptystat.es` |
| Interactive UI | React 19 islands |
| Styling | Tailwind 4 |
| Admin auth | Cloudflare Access (Zero Trust) |
| Bot defence | Cloudflare Turnstile |
| Inference | Workers AI |
| Analytics | First-party endpoint → Plausible, mirrored to D1 |

### EMDash is dropped

The April spec built on EMDash 0.1.0. That is abandoned, for reasons that got
stronger as this brief grew:

- The admin area is now a **product with its own requirements** — a mobile review
  queue, one-tap publishing, agent triage. A generic CMS admin is worst at exactly
  this, and every feature in specs 03 and 04 would be a workaround.
- A public submission queue is not a CMS concept. It has no home in EMDash's model.
- EMDash 0.1.0's documentation is unreliable (see the project's own gotchas note:
  wrong import paths, a required `src/live.config.ts` that fails silently when
  absent, reserved field collisions, an admin API that resists CLI auth).

The cost of leaving is low **by prior design**. The April spec's "Escape Hatch"
clause put data in D1 + R2 independent of the CMS and noted that EMDash themes are
plain Astro projects. Both hold. No data migration is required — only the removal
of the `emdash` integration and the replacement of `getEmDashCollection` calls with
direct D1 queries.

**Work to remove:** `emdash` and `@emdash-cms/cloudflare` from `package.json`, the
`emdash()` integration from `astro.config.mjs`, `src/live.config.ts`,
`emdash-env.d.ts`, and `.emdash/seed.json` (whose field definitions are carried
into the schema below).

---

### Inherited and rejected

The April 2026 spec and `.emdash/seed.json` are prior art, not precedent. Each
element was re-examined against what the platform offers now, and several did not
survive. Recording them here so they are not silently reintroduced.

**Focal points (`focal_x`, `focal_y`) — dropped.** They existed to drive a
crop-to-focal thumbnail and a hover-zoom pan. Neither view mode crops: justified
rows render each image at its true aspect ratio, and square mode contains the whole
image inside a padded cell. A focal point with nothing to focus is two columns of
maintenance and a curation chore across 235 entries, buying nothing. If a
crop-based view is ever added, this comes back — with the field, not before it.

**Tesseract — replaced by Workers AI vision.** The April plan ran `tesseract.js` at
build time because that was the reasonable choice then. It is no longer: Workers AI
now hosts vision-language models (`@cf/moondream/moondream3.1-9B-A2B`,
`@cf/google/gemma-4-26b-a4b-it`) that read UI screenshots far more accurately than
classical OCR, handle low-contrast and anti-aliased type that Tesseract mangles, and
run as a subrequest rather than consuming CPU. The field is renamed `screen_text`
accordingly — it is no longer OCR output, and calling it `ocr_text` would misdescribe
both its provenance and its quality.

The same call returns more than text. One vision request per submission can produce
screen text, a description, suggested tags, and the OS inferred from UI chrome —
replacing what would otherwise be several separate pipelines. Spec 02 details this;
spec 04 reuses the same call for triage.

**`device_type` values `tv`, `watch` and `game` — dropped.** They appear in the
April spec's enum and in `seed.json`. They appear **nowhere in the 729 content
files**. Tag counts across the real corpus: `mobile` 392, `desktop` 72, `browser`
50, and no television, watch or console entry at all. A `CHECK` constraint listing
values that have never existed is a form of fiction that makes the submission form
longer and the facet bar wider for no one. `phone | tablet | desktop` is what the
data supports; adding a value later is one migration.

**Build-time processing — dropped.** The April design assumed a static build with a
build-time OCR pass and a build-time search index. The site is
`output: "server"` on Workers, so there is no build to hang work off, and
submissions arrive continuously rather than at deploy time. Ingest happens at
upload; nothing waits for a deploy.

**Client-side JSON search index — dropped.** It cannot rank, and shipping the whole
corpus including screen text to every visitor gets worse with every entry added.
Superseded by D1 + FTS5.

**Kept, and why:** D1 + R2 (the right primitives, and already provisioned); Astro
with React islands (current, and the existing gallery components port directly);
`/s/<slug>` URLs (breaking them would cost the site its inbound links); ULIDs via
`ulidx` (already a dependency, and time-sortable).

## The 10ms CPU constraint

This is the single most consequential platform limit for this project.

Workers free plan allows **10ms of CPU per invocation**, and that applies to Cron
Triggers as well as HTTP requests. Not wall time — CPU time.

| Work | CPU cost | Where it runs |
|---|---|---|
| Render a gallery page | < 1ms | Worker |
| D1 query, including FTS5 | I/O, not CPU | Worker |
| Workers AI inference | I/O, not CPU | Worker |
| R2 read/write | I/O, not CPU | Worker |
| **Screen-text extraction** | I/O, not CPU | **Worker, via Workers AI** |
| **Colour quantisation** | 100–400ms | **Browser at upload** |
| **Thumbnail generation** | 50–300ms | **Browser at upload** |

The distinction that matters: **Workers AI inference is a subrequest, not
computation**. It does not touch the 10ms CPU budget, so anything a vision model can
do stays server-side. Only work requiring raw pixel access in JavaScript has to move
to the client.

That leaves colour quantisation and thumbnail generation. The submitter's browser
downscales to a 64×64 bitmap on a canvas, runs k-means for the dominant palette,
converts to CIELAB, and generates the WebP variants — then posts them alongside the
original. Cost to the platform: zero CPU. It scales with submitters rather than with
budget.

Legacy backfill runs as a local Node script, the pattern the repo already uses
(`npm run thumbnails`).

**Trust boundary:** client-derived data is *descriptive*, never *authoritative*.
Dimensions, alpha channel and file size are re-checked server-side from the image
bytes because rules depend on them (spec 03). Colours are accepted as given — a
submitter who falsifies them only degrades their own entry's discoverability, and
they are re-derivable offline at any time.

---

## Data model

All tables live in the existing `emptystates-db` D1 database.

### `states` — a published entry

```sql
CREATE TABLE states (
  id               TEXT PRIMARY KEY,          -- ULID, sorts by creation time
  slug             TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  app_name         TEXT NOT NULL,
  app_url          TEXT,

  device_type      TEXT NOT NULL CHECK (device_type IN
                     ('phone','tablet','desktop')),
  os               TEXT NOT NULL CHECK (os IN
                     ('ios','android','web','macos','windows')),

  r2_key           TEXT NOT NULL,
  width            INTEGER NOT NULL,
  height           INTEGER NOT NULL,
  aspect_ratio     REAL NOT NULL,             -- width/height, denormalised for layout

  screen_text      TEXT,
  color_names      TEXT,                      -- 'navy blue dark cool' — for FTS

  status           TEXT NOT NULL DEFAULT 'published'
                     CHECK (status IN ('published','draft')),
  is_legacy        INTEGER NOT NULL DEFAULT 0,  -- predates the submission rules
  submitter_name   TEXT,
  submitter_handle TEXT,

  captured_at      TEXT,
  published_at     TEXT NOT NULL,
  created_at       TEXT NOT NULL
);

CREATE INDEX idx_states_browse  ON states (status, published_at DESC);
CREATE INDEX idx_states_device  ON states (status, device_type);
CREATE INDEX idx_states_os      ON states (status, os);
CREATE INDEX idx_states_aspect  ON states (status, aspect_ratio);
```

`aspect_ratio` is stored rather than computed because the layout needs it on every
row of every gallery query, and because it is a search facet ("screen size").

`is_legacy` marks the 235 imported entries that predate the submission rules. They
break those rules — alpha channels, crops, missing OCR — and must not be judged
against them. It also lets the admin area surface a backlog of entries to clean up.

### `tags` and `state_tags`

```sql
CREATE TABLE tags (
  id    INTEGER PRIMARY KEY,
  slug  TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL
);

CREATE TABLE state_tags (
  state_id TEXT NOT NULL REFERENCES states(id) ON DELETE CASCADE,
  tag_id   INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (state_id, tag_id)
);

CREATE INDEX idx_state_tags_tag ON state_tags (tag_id, state_id);
```

A join table rather than the comma-separated column EMDash used, because tag
filtering is a primary facet and needs an index.

### `state_colors`

```sql
CREATE TABLE state_colors (
  state_id TEXT NOT NULL REFERENCES states(id) ON DELETE CASCADE,
  rank     INTEGER NOT NULL,        -- 1..5, by descending coverage
  hex      TEXT NOT NULL,
  l        REAL NOT NULL,           -- CIELAB
  a        REAL NOT NULL,
  b        REAL NOT NULL,
  coverage REAL NOT NULL,           -- 0..1 share of pixels
  bucket   TEXT NOT NULL,           -- named bucket, e.g. 'blue'
  PRIMARY KEY (state_id, rank)
);

CREATE INDEX idx_colors_bucket ON state_colors (bucket, state_id);
```

Colour is stored twice on purpose. `bucket` is a name, indexed for the swatch
filter and copied into `states.color_names` for the text index — so typing "blue"
works. `l`/`a`/`b` are perceptual coordinates for distance ranking, because RGB
distance judges colour badly and CIELAB is built to approximate how eyes compare it.

### `states_fts`

```sql
CREATE VIRTUAL TABLE states_fts USING fts5(
  title,
  app_name,
  tags,
  colors,
  screen_text,
  state_id UNINDEXED,
  tokenize = 'porter unicode61'
);
```

A **standalone** FTS5 table, not `content=`-backed. External-content FTS5 requires
every indexed column to exist on the content table, and `tags` and `colors` live in
join tables. The application rewrites the row on every write to `states`,
`state_tags` or `state_colors`.

`porter` stemming means "loading" matches "load". Query-time weighting via
`bm25(states_fts, 10.0, 8.0, 6.0, 4.0, 1.0)` puts title an order of magnitude above
screen text — the thing that stops forty screenshots with a "Search" placeholder
drowning the six entries actually about search.

### `submissions`

Detailed in spec 03. Summary shape:

```sql
CREATE TABLE submissions (
  id                 TEXT PRIMARY KEY,
  status             TEXT NOT NULL       -- pending | auto_rejected | approved | rejected
                       CHECK (status IN ('pending','auto_rejected','approved','rejected')),
  source             TEXT NOT NULL       -- public | admin
                       CHECK (source IN ('public','admin')),

  r2_key             TEXT NOT NULL,
  width              INTEGER NOT NULL,
  height             INTEGER NOT NULL,
  aspect_ratio       REAL NOT NULL,
  has_alpha          INTEGER NOT NULL,
  byte_size          INTEGER NOT NULL,

  title              TEXT NOT NULL,
  app_name           TEXT NOT NULL,
  app_url            TEXT,
  device_type        TEXT NOT NULL,
  os                 TEXT NOT NULL,
  tags_json          TEXT NOT NULL,

  screen_text        TEXT,
  colors_json        TEXT,

  submitter_name     TEXT,
  submitter_handle   TEXT,

  checks_json        TEXT NOT NULL,      -- per-rule pass/fail, see spec 03
  agent_verdict      TEXT,               -- reject | review
  agent_reason       TEXT,
  agent_confidence   REAL,
  duplicate_of       TEXT REFERENCES states(id),

  created_at         TEXT NOT NULL,
  reviewed_at        TEXT,
  published_state_id TEXT REFERENCES states(id)
);

CREATE INDEX idx_submissions_queue ON submissions (status, created_at DESC);
```

### `events` and `search_log`

```sql
CREATE TABLE events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  props_json TEXT,
  path       TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_events_name ON events (name, created_at DESC);

CREATE TABLE search_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  query       TEXT NOT NULL,
  results     INTEGER NOT NULL,
  facets_json TEXT,
  created_at  TEXT NOT NULL
);

CREATE INDEX idx_search_zero ON search_log (results, created_at DESC);
```

No IP, no user agent, no session identifier is ever written to D1. Those exist only
in memory for the duration of the Plausible forward.

### `layout_prefs`

```sql
CREATE TABLE layout_prefs (
  view TEXT PRIMARY KEY,   -- justified | square
  n    INTEGER NOT NULL DEFAULT 0
);
```

A counter, not an event log, so a toggle costs one `UPDATE` rather than one
`INSERT`. The per-event detail lives in Plausible.

---

## R2 layout

```
originals/<state_id>.<ext>          # exactly as submitted, never modified
w640/<state_id>.webp                # gallery, phone viewports
w1280/<state_id>.webp               # gallery, desktop viewports and detail page
submissions/<submission_id>.<ext>   # pending; moved to originals/ on approval
```

Served from a public bucket on `img.emptystat.es`. **Requests to R2 via a public
bucket do not invoke the Worker**, so images do not consume the 100,000/day request
allowance — which matters, because a single gallery page loads dozens of them.

Cloudflare Image Resizing is a paid feature and is not used. Variants are generated
at ingest, in the browser (spec 03) or by local script (spec 02).

---

## URL structure

Existing `/s/<slug>` URLs are preserved. The legacy site's 34 `redirect` frontmatter
entries are already handled by the Gatsby deployment and carry over.

| Route | Purpose |
|---|---|
| `/` | Gallery, paginated |
| `/s/<slug>` | Entry detail |
| `/tags/<tag>` | Pre-filtered gallery, preserved from the legacy site |
| `/submit` | Submission form |
| `/guidelines` | Submission rules |
| `/admin/*` | Behind Cloudflare Access |
| `/api/search` | Search endpoint |
| `/api/e` | First-party analytics ingest |
| `/api/submit` | Submission ingest |

Filter state lives in query parameters so any view is shareable:
`/?q=no+results&device=phone&os=ios&tag=onboarding&color=blue&view=square`

---

## Analytics

A first-party endpoint, `POST /api/e`, on the site's own origin. The browser never
contacts `plausible.io`, so there is no third-party domain and no known script name
for a blocker to match. This captures every visitor rather than the fraction that
survives blocking, which was the point of building it rather than using the script.

The Worker does two things with one request:

**Forwards to Plausible** inside `ctx.waitUntil()`, so the visitor's response is not
held up. This must carry:

- `User-Agent` — the *visitor's* raw UA from the incoming request
- `X-Forwarded-For` — **`CF-Connecting-IP`, not the Worker's egress IP**
- `Content-Type: application/json`

Plausible derives `user_id` by hashing UA + IP. Forward a CDN or server IP and bot
filtering silently drops the event; you still get `202 Accepted`, and the only
signal is an `x-plausible-dropped: 1` response header. Check it, and log failures.

**Writes to D1** — anonymised, in the same handler. This is the queryable copy, and
it answers what Plausible's dashboard cannot: which filter combinations co-occur,
whether square-mode visitors open more entries than justified-mode ones, and which
searches return nothing.

### Event taxonomy

Custom properties are used, which requires Plausible's **Business plan**. Maximum 30
props per event; property names up to 300 characters, values up to 2,000.

| Event | Props | Purpose |
|---|---|---|
| `pageview` | — | Standard |
| `View Mode` | `view`, `viewport` | Settles justified vs square with data |
| `Search` | `results`, `zero` | Query text goes to D1 only |
| `Zero Results` | `query` | The content roadmap |
| `Filter` | `facet`, `value` | Which of the six dimensions get used |
| `Entry Open` | `slug`, `from_view` | Does layout affect engagement |
| `Submission Completed` | `device`, `os` | Funnel |

**`Search` fires on debounced commit, never per keystroke.** Every event counts
against the monthly Plausible quota; a per-keystroke implementation would burn a
month's allowance in a day. Same reasoning applies to D1's 100,000 writes/day.

Set `interactive: false` on events that are not visitor-initiated, so they do not
distort bounce rate.

---

## Free-tier budget

| Resource | Free allowance | Expected use | Headroom |
|---|---|---|---|
| Worker requests | 100,000/day | ~2,000/day | Wide. Images bypass the Worker entirely |
| Worker CPU | 10ms/invocation | < 1ms rendering | Tight by design — see the constraint section |
| D1 rows read | 5,000,000/day | ~60,000/day | Wide |
| D1 rows written | 100,000/day | ~2,000/day | Adequate. Analytics is the growth risk |
| D1 storage | 5 GB | < 50 MB | Wide |
| R2 storage | 10 GB | ~2 GB at 1,000 entries | Adequate |
| R2 Class A ops | 1M/month | ~100/month | Wide |
| R2 Class B ops | 10M/month | ~200,000/month | Wide |
| Workers AI | 10,000 Neurons/day | ~50/day | Wide at submission volumes |
| Turnstile | Unlimited | — | — |

**The two things that could break the budget**, both in analytics: an un-debounced
search event, and one row per event rather than aggregate counters where counters
suffice. Both are designed against above.

Cloudflare Access seat allowance on the Zero Trust free plan should be confirmed at
setup. This project needs one seat.

---

## Cross-cutting conventions

- **IDs are ULIDs.** `ulidx` is already a dependency. They sort by creation time,
  which makes `ORDER BY id` a valid recency sort and removes a column from most
  queries.
- **Timestamps are ISO 8601 strings in UTC.** SQLite has no date type. Note that
  `gray-matter` returns `Date` objects during legacy migration, so `String()` them
  before binding.
- **`slug` is generated from title + app name**, deduplicated with a numeric suffix.
- **Every write that touches `states`, `state_tags` or `state_colors` rewrites the
  matching `states_fts` row**, in the same transaction. Drift here is the most
  likely source of "the tag says 12 but search says 9".
- **Client-derived data is descriptive, not authoritative.** Re-derive anything a
  rule depends on.

---

## Risks

**Analytics write volume.** D1's 100,000 rows/day is the tightest allowance in the
budget, and events are the only unbounded writer. Mitigation: counters over logs
where possible, debounced search, and a monitor on the daily figure. If it ever
binds, batch events in a Durable Object and flush periodically.

**Client-side colour extraction varies by device.** Canvas k-means on a 64×64
bitmap is cheap, but an old phone on a slow connection is still the worst case, and
the whole point of the admin capture flow is uploading from a phone. The upload must
not block on it — post the image first, post derived data second, and accept its
absence. A missing palette costs colour search on that one entry until backfill,
which is a far better failure than a stalled upload.

Moving screen text to Workers AI removed the larger version of this risk, since
inference no longer depends on the submitter's hardware at all.

**Plausible attribution is silent when it fails.** The API returns `202` whether the
event landed or was dropped. Without checking `x-plausible-dropped`, a wrong
`X-Forwarded-For` would look like low traffic rather than a bug.

**Legacy entries break the new rules.** 235 imported entries have alpha channels,
crops outside device ratios, and no extracted text. `is_legacy` keeps them out of
rule enforcement, but they will look inconsistent in the grid until curated.
Accepted for v1; the admin area surfaces them as a backlog.

**The legacy tag field is not clean data.** In the existing content, one `tags`
array conflates three separate dimensions — device (`mobile` 392, `desktop` 72),
OS (`ios` 64, `android` 64, `macOS` 12, `macos` 8, `windows` 2) and genuine semantic
tags (`permissions`, `onboarding`, `location`). It also contains junk: entry titles
that landed in the tags array during a previous migration ("No downloads in
Bitbucket" appears six times as a *tag*), empty strings, and case-variant duplicates
of the same OS.

The new schema separates these into `device_type`, `os` and `state_tags`, so
migration is a mapping and cleaning pass, not a copy. It needs an explicit
device/OS/tag classification table, case normalisation, junk rejection, and a
report of anything unmapped for manual triage. Budget real time for this — it is
the single most underestimated task in spec 01.

**Two view modes are two layouts to maintain.** Justified and square must agree on
pagination, hover behaviour and keyboard navigation. Mitigation: one card component,
two container components, and the tracking that tells us when one can be retired.
