# EmptyStates — Architecture

**Date:** 2026-08-10
**Status:** approved, ready for sub-specs
**Supersedes:** `2026-04-08-redesign-design.md` (EMDash approach, abandoned)

Umbrella document. Fixes the stack, the data model, the compute model, the cost
model and the shared conventions. Sub-specs inherit everything here.

| # | Spec | Depends on | Phase |
|---|---|---|---|
| 01 | Foundation + gallery | — | 1 |
| 02 | Ingest + search | 01 | 1 |
| 03 | Submissions | 01, 02 | 1 |
| 04 | Admin + agent | 01, 02, 03 | 1–2 |
| 05 | MCP server | 02 | 2–3 |

---

## Problem

`emptystat.es` curates 235+ empty-state screenshots. Three things are missing and
one is wrong.

Missing: a public submission route, an admin area optimised for review, and search
across the dimensions that matter — tags, screen text, app name, colour, date,
screen size, OS.

Wrong: the layout. The library spans a 7× range of aspect ratios and no grid so far
handles the mix without either letterboxing the 77% of entries that are phones or
burying the desktop entries that most need the space.

## Goals

- One grid presenting phone, tablet and desktop honestly in a single view.
- Search across all dimensions from one free-text field, with facets on top.
- A public submission flow with enforceable content rules.
- An admin area optimised for mobile review and one-tap publishing.
- Predictable, small running costs.

## Non-goals

- **Monetisation.** This site does one thing and is not a business. No paywall, no
  accounts, no upsell. This constrains later decisions and is recorded deliberately.
- Migrating the legacy Gatsby hosting — shipped separately, see
  `2026-08-10-gatsby-cloudflare-migration-design.md`.
- Submitter accounts or logins.
- Email notification to submitters. Deferred past v1.
- Auto-publishing without human review. See spec 04.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Astro 6, `output: "server"`, `@astrojs/cloudflare` |
| Runtime | Cloudflare Workers (**Paid plan**) |
| Database | Cloudflare D1, including FTS5 |
| Object storage | Cloudflare R2, public bucket on `img.emptystat.es` |
| Async work | Cloudflare Queues |
| Interactive UI | React 19 islands |
| Styling | Tailwind 4 |
| Admin auth | Cloudflare Access (Zero Trust) |
| Bot defence | Cloudflare Turnstile |
| Inference | Workers AI (vision) |
| Analytics | Plausible, standard script + one first-party event |

### EMDash is dropped

The April spec built on EMDash 0.1.0. Abandoned, for reasons that strengthened as
the brief grew:

- The admin area is now **a product with its own requirements** — mobile review
  queue, one-tap publishing, agent triage. A generic CMS admin is worst at exactly
  this, and specs 03 and 04 would be workarounds throughout.
- A public submission queue is not a CMS concept and has no home in EMDash's model.
- EMDash 0.1.0's documentation is unreliable: wrong import paths, a required
  `src/live.config.ts` that fails silently when absent, reserved field collisions,
  an admin API that resists CLI auth.

Leaving is cheap **by prior design** — the April spec's "Escape Hatch" put data in
D1 + R2 independent of the CMS, and noted EMDash themes are plain Astro projects.
Both hold. No data migration; only removal of the integration and replacement of
`getEmDashCollection` calls with direct D1 queries.

**To remove:** `emdash` and `@emdash-cms/cloudflare` from `package.json`, the
`emdash()` integration from `astro.config.mjs`, `src/live.config.ts`,
`emdash-env.d.ts`, `.emdash/seed.json`.

### Inherited and rejected

Prior art is not precedent. Each element of the April spec was re-tested against
what the platform offers now. Recording the rejections so they are not silently
reintroduced.

**Focal points (`focal_x`, `focal_y`) — dropped.** They drove a crop-to-focal
thumbnail and hover-zoom pan. Neither view mode crops: justified rows render true
aspect ratios, square mode contains the whole image in a padded cell. A focal point
with nothing to focus is two columns and a 235-entry curation chore buying nothing.
If a crop-based view is ever added, this returns with it — not before.

**Tesseract — replaced by Workers AI vision.** The April plan ran `tesseract.js` at
build time, reasonable then, not now. Workers AI hosts vision-language models
(`@cf/moondream/moondream3.1-9B-A2B`, `@cf/google/gemma-4-26b-a4b-it`) that read UI
screenshots far more accurately than classical OCR — particularly the low-contrast,
anti-aliased type that is most app UI, and precisely what Tesseract mangles. The
field is renamed `screen_text`: calling it `ocr_text` would misdescribe both its
provenance and its quality.

One vision call returns more than text — screen text, a description, suggested tags,
and OS inferred from UI chrome. That collapses what would have been four pipelines,
and means spec 04's agent needs no separate "look at this image" step because ingest
already looked.

**Build-time processing — dropped.** The April design hung OCR and index-building
off a static build. There is no build: the site is `output: "server"`, and
submissions arrive continuously rather than at deploy time.

**Client-side JSON search index — dropped.** It cannot rank, and shipping the whole
corpus including screen text to every visitor degrades with every entry added.
Superseded by D1 + FTS5.

**Kept:** D1 + R2 (right primitives, already provisioned); Astro with React islands
(current, existing gallery components port directly); `/s/<slug>` URLs (breaking them
costs inbound links); ULIDs via `ulidx` (already a dependency, time-sortable).

---

## Compute model

The project runs on **Workers Paid**. This is a deliberate purchase, not a default,
and it is worth being explicit about what it buys.

| Limit | Free | Paid |
|---|---|---|
| CPU per invocation | 10 ms | 5 min (30 s default) |
| CPU per Cron Trigger | 10 ms | 15 min |
| Requests | 100,000/day | 10M/month included |
| Subrequests per invocation | 50 external | 10,000 |
| Queues | unavailable | available |

On the free plan, colour quantisation (100–400 ms CPU) and thumbnail generation
(50–300 ms) could not run in a Worker at all, which forced them into the browser and
forced backfill into local scripts holding account credentials. Three ingest paths
that had to agree with each other, for the sake of one number.

Paid removes that entirely. **There is one ingest pipeline**, server-side, used
identically by public submissions, admin uploads and legacy backfill.

### The ingest pipeline

```
        ┌── POST /api/submit ────┐
        │   (public form)        │
        ├── POST /api/admin/capture ─┤       ┌─────────────────┐
        │   (your phone)         │   ──────▶│  INGEST queue   │
        ├── POST /api/admin/backfill ┤       └────────┬────────┘
        │   (legacy, batched)    │                    │
        └────────────────────────┘                    ▼
                                          ┌───────────────────────┐
                                          │ 1. read bytes from R2 │
                                          │ 2. decode + dimensions│
                                          │ 3. alpha / size checks│
                                          │ 4. WebP variants      │
                                          │ 5. k-means → CIELAB   │
                                          │ 6. Workers AI vision  │
                                          │ 7. write D1 + FTS row │
                                          └───────────────────────┘
```

A Queue consumer, not a request handler, because:

- **Retries are free.** A Workers AI timeout retries the message rather than losing
  the submission.
- **The submitter is not waiting.** The upload returns as soon as bytes are in R2.
- **Backfill is the same code.** 235 legacy entries are 235 queue messages. No
  separate script, no separate code path to drift.

Steps 2–5 need raw pixel access in JS and consume real CPU — hundreds of
milliseconds, comfortably inside the 15-minute consumer budget. Step 6 is a
subrequest and consumes none.

**No local scripts.** The one-time legacy migration is triggered by an authenticated
admin endpoint that enqueues messages. Nothing on a laptop ever holds account
credentials or talks to D1 directly.

---

## Cost model

Conservative, and deliberately pessimistic on the two variable lines.

### Fixed monthly

| Item | Cost | Note |
|---|---|---|
| Workers Paid | **$5.00** | Includes 10M requests, 30M CPU-ms, D1 (25B rows read, 50M written, 5 GB), Queues |
| Plausible Business | **$0.00** | Already subscribed for multiple sites — this site is an additional site within the existing plan, not a new bill |
| **Fixed marginal total** | **$5.00/mo** | |

Plausible Business covers up to 10 sites, so adding `emptystat.es` costs nothing
beyond what is already being paid. The figures below are therefore the *marginal*
cost of this project, which is the number that matters for a decision about
building it.

### Variable, at three scales

Assumes ~2 MB per original plus ~0.9 MB of WebP variants across the three widths,
and one vision call per new entry.

| | 500 entries | 2,000 entries | 10,000 entries |
|---|---|---|---|
| R2 storage | 1.5 GB — free | 5.8 GB — free | 29 GB → $0.29 |
| R2 ops | free tier | free tier | free tier |
| D1 storage | < 20 MB — included | < 80 MB — included | < 400 MB — included |
| Requests | well inside 10M | well inside 10M | well inside 10M |
| Workers AI | free allocation | free allocation | ~$1–3 |
| **Variable total** | **$0.00** | **$0.00** | **~$1–3** |
| **All-in, marginal** | **$5/mo** | **$5/mo** | **~$6–8/mo** |

R2's 10 GB free allowance is the line that eventually moves, and it moves slowly —
roughly 4,000 entries before it binds, at $0.015/GB-month after that. At 10,000
entries the entire Cloudflare bill is still under $6.

**Workers AI, computed from published unit pricing (2026-08-11).**
`@cf/moondream/moondream3.1-9B-A2B` is $0.30/M input and $1.00/M output tokens. At
roughly 1,500 image tokens plus 200 prompt and 400 output, that is **~$0.0009 per
image** — about **110 free calls per day** against the 10,000-Neuron allowance, and
~$0.21 for the whole 229-entry backfill.

One assumption remains: the image token count, which varies with the model's tiling.
Read it from the `usage` field on the first real call and correct these figures.

Ingest is one call per *new* entry, so cost tracks submission rate, not traffic — a
viral day costs nothing extra. **This line was previously flagged as the main
financial risk; at a tenth of a cent per call it is not.** R2 storage is the real
variable cost.

**Plausible tier.** Business is already in place for other sites, so custom
properties, the Stats API (600 requests/hour) and five-year retention are all
available at no marginal cost.

That does **not** reinstate the full event taxonomy — reducing to Plausible defaults
was a scope decision about what is worth measuring, not a cost workaround, and it
stands. What it does change is the shape of the one custom event: the grid selection
becomes a single `View Mode` event with `view` and `viewport` properties, rather
than two separate event names. One goal to configure, breakdown by property in the
dashboard, and viewport width comes along for free — which matters, because the
justified-versus-square question may well have different answers on a phone than on
a 27-inch display.

The Stats API also opens a phase-2 option worth noting but not building yet: the
admin dashboard could pull Plausible figures in, so the review queue and the traffic
it generates sit on one screen.

### What would change the picture

- Traffic growth alone does not move the bill. Requests, D1 reads and R2 egress all
  have wide headroom, and images bypass the Worker via the public bucket.
- Submission volume is the real cost driver, through Workers AI and R2 storage.
- If Workers AI proves expensive per call, the fallback is running vision only on
  submissions that pass deterministic checks — cutting spend by whatever share of
  submissions are junk.

---

## Data model

### `device_types` — extensible, not an enum

```sql
CREATE TABLE device_types (
  slug         TEXT PRIMARY KEY,   -- phone, tablet, desktop, tv, console, watch
  label        TEXT NOT NULL,
  sort_order   INTEGER NOT NULL,
  is_active    INTEGER NOT NULL DEFAULT 1,
  min_ratio    REAL,               -- expected aspect range, for validation + inference
  max_ratio    REAL,
  created_at   TEXT NOT NULL
);
```

Seeded with `phone`, `tablet`, `desktop`, `tv`, `console`, `watch`.

A **table, not a `CHECK` constraint**. The earlier draft dropped `tv`, `watch` and
`console` on the grounds that none appear in the 729 existing content files. That
reasoning was wrong: the corpus records what has been collected, not what is worth
collecting, and the curator's intent is the authority on the latter. Adding a device
type must not require a schema migration.

`min_ratio` / `max_ratio` let the pipeline sanity-check a claimed device against the
image's actual shape, and flag mismatches for review rather than rejecting them.

**Submitting an unlisted device type.** The submission form offers the active types
plus an "Other" option with a free-text field, captured as
`submissions.device_type_other`. It never creates a row directly — a public form that
writes to a taxonomy table is a taxonomy that fills with typos and duplicates. The
admin review screen shows the proposed text and offers "map to existing type" or
"create new device type", which is the one-tap promotion path. New types appear in
the facet bar automatically once created.

### `states`

```sql
CREATE TABLE states (
  id               TEXT PRIMARY KEY,          -- ULID, sorts by creation time
  slug             TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  app_name         TEXT,                     -- nullable; see note below
  app_url          TEXT,

  device_type      TEXT NOT NULL REFERENCES device_types(slug),
  os               TEXT NOT NULL REFERENCES operating_systems(slug),

  r2_key           TEXT NOT NULL,
  width            INTEGER NOT NULL,
  height           INTEGER NOT NULL,
  aspect_ratio     REAL NOT NULL,             -- denormalised: layout needs it per row
  byte_size        INTEGER NOT NULL,          -- original's size, shown on the detail link

  screen_text      TEXT,                      -- Workers AI vision
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
```

`operating_systems` mirrors `device_types` — same shape, same extensibility, same
promotion path. Seeded with `ios`, `android`, `web`, `macos`, `windows`, `linux`.

`is_legacy` marks the 235 imported entries predating the submission rules. They
break those rules and must not be judged against them; it also gives the admin area
a curation backlog.

**`app_name` is nullable, deliberately.** Only 57 of the 235 legacy entries carry a
`product` field, and titles do not rescue the rest — 66 contain " in ", and parsing
those yields "Outlook for Android" rather than "Outlook". "App name is required" is a
*submission rule*, enforced in application code on the form; hardening it into a
`NOT NULL` constraint would make the existing corpus unrepresentable. Submission
rules and schema constraints are not the same thing. Spec 02's vision pass backfills
where it can.

### `state_relations`

```sql
CREATE TABLE state_relations (
  state_id         TEXT NOT NULL REFERENCES states(id) ON DELETE CASCADE,
  related_state_id TEXT NOT NULL REFERENCES states(id) ON DELETE CASCADE,
  PRIMARY KEY (state_id, related_state_id),
  CHECK (state_id <> related_state_id)
);
CREATE INDEX idx_relations_related ON state_relations (related_state_id);
```

Eighteen legacy entries carry a hand-curated `related` frontmatter list naming other
empty states. That is manual curation work and is preserved rather than discarded.

Values are *titles*, so import resolves them to ids in a second pass once every row
exists; anything that fails to resolve is reported, never guessed. Directed rather
than symmetric, because A listing B did not always mean B listed A. Surfaced on the
detail page.

### `tags`, `state_tags`, `state_colors`

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

CREATE TABLE state_colors (
  state_id TEXT NOT NULL REFERENCES states(id) ON DELETE CASCADE,
  rank     INTEGER NOT NULL,        -- 1..5 by descending coverage
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

Colour is stored twice on purpose. `bucket` is a name — indexed for the swatch
filter and copied into `states.color_names` for the text index, so typing "blue"
works. `l`/`a`/`b` are perceptual coordinates for distance ranking, because RGB
distance judges colour badly and CIELAB approximates how eyes compare it.

### `states_fts`

```sql
CREATE VIRTUAL TABLE states_fts USING fts5(
  title, app_name, tags, colors, screen_text, description,
  state_id UNINDEXED,
  tokenize = 'porter unicode61'
);
```

**Standalone**, not `content=`-backed: external-content FTS5 requires every indexed
column on the content table, and tags and colours live in join tables. The
application rewrites the row on any write to `states`, `state_tags` or
`state_colors`, in the same transaction.

`porter` stemming makes "loading" match "load". Query-time
`bm25(states_fts, 10.0, 8.0, 6.0, 4.0, 1.0, 2.0)` puts title an order of magnitude
above screen text — what stops forty screenshots containing a "Search" placeholder
drowning the six entries actually about search.

### `submissions`

Detailed in spec 03. Shape:

```sql
CREATE TABLE submissions (
  id                  TEXT PRIMARY KEY,
  status              TEXT NOT NULL
                        CHECK (status IN ('queued','pending','auto_rejected','approved','rejected')),
  source              TEXT NOT NULL CHECK (source IN ('public','admin','backfill')),

  r2_key              TEXT NOT NULL,
  width               INTEGER, height INTEGER, aspect_ratio REAL,
  has_alpha           INTEGER, byte_size INTEGER,

  title               TEXT, app_name TEXT, app_url TEXT,
  device_type         TEXT, device_type_other TEXT,
  os                  TEXT, os_other TEXT,
  tags_json           TEXT,

  screen_text         TEXT, description TEXT, colors_json TEXT,
  suggested_tags_json TEXT,

  submitter_name      TEXT, submitter_handle TEXT,

  checks_json         TEXT,
  agent_verdict       TEXT, agent_reason TEXT, agent_confidence REAL,
  duplicate_of        TEXT REFERENCES states(id),

  created_at          TEXT NOT NULL,
  reviewed_at         TEXT,
  published_state_id  TEXT REFERENCES states(id)
);
CREATE INDEX idx_submissions_queue ON submissions (status, created_at DESC);
```

### `search_log` and `layout_prefs`

```sql
CREATE TABLE search_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  query       TEXT NOT NULL,
  results     INTEGER NOT NULL,
  facets_json TEXT,
  created_at  TEXT NOT NULL
);
CREATE INDEX idx_search_zero ON search_log (results, created_at DESC);

CREATE TABLE layout_prefs (
  view       TEXT NOT NULL,        -- justified | square
  day        TEXT NOT NULL,        -- YYYY-MM-DD
  n          INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (view, day)
);
```

`search_log` is a **curation tool, not analytics** — the zero-result list is the
content roadmap, telling you which empty states people look for and you do not have.
It survives the reduction to Plausible defaults because it answers a question
Plausible was never going to. No IP, no user agent, no session identifier.

---

## R2 layout

```
originals/<state_id>.<ext>          # exactly as submitted, never modified
                                    # reached only via the detail page's explicit
                                    # "open original" link, never as a display image
w640/<state_id>.webp                # gallery, phone viewports
w1280/<state_id>.webp               # gallery desktop, detail page at 1x
w2560/<state_id>.webp               # detail page on large or high-density displays
submissions/<submission_id>.<ext>   # pending; moved to originals/ on approval
```

Public bucket on `img.emptystat.es`. **R2 public-bucket requests do not invoke the
Worker**, so images never consume the request allowance — which matters when one
gallery page loads dozens.

Cloudflare Image Resizing is a paid add-on and is not used; variants are generated
once in the ingest pipeline.

---

## URL structure

`/s/<slug>` is preserved. The legacy site's 34 `redirect` frontmatter entries are
handled by the existing Gatsby deployment and carry over.

| Route | Purpose |
|---|---|
| `/` | Gallery, paginated |
| `/s/<slug>` | Entry detail |
| `/tags/<tag>` | Pre-filtered gallery, preserved |
| `/submit` | Submission form |
| `/guidelines` | Submission rules |
| `/privacy` | **Analytics disclosure and opt-out** |
| `/admin/*` | Behind Cloudflare Access |
| `/api/search` | Search |
| `/api/view-pref` | Grid selection capture |
| `/api/submit` | Submission ingest |
| `/mcp` | Phase 2–3, see below |

Filter state lives in query parameters, so any view is shareable:
`/?q=no+results&device=phone&os=ios&tag=onboarding&color=blue&view=square`

---

## Analytics

**Plausible does its standard job.** The normal script, standard pageviews, standard
referrers. No custom event taxonomy, no D1 event mirror. Plausible is already
cookieless and privacy-preserving, and reimplementing it in a first-party endpoint
buys accuracy that this site does not need for ordinary traffic.

**One exception: the grid selection.** Which layout people choose is the question
this whole design hangs on, and it must be answered across as close to every visitor
as possible — including those running blockers, who are disproportionately likely to
be the designers and developers this site serves. That single event goes to
`POST /api/view-pref` on the site's own origin, where the Worker:

1. Increments the `layout_prefs` counter for that view and day — a counter, not an
   event log, so a toggle costs one `UPDATE` rather than one `INSERT`.
2. Forwards to Plausible inside `ctx.waitUntil()` as a `View Mode` event with
   properties `{ view: "justified" | "square", viewport: <breakpoint> }`, so it
   surfaces in the dashboard already being checked.

Forwarding must carry the **visitor's** `User-Agent` and `X-Forwarded-For` set from
`CF-Connecting-IP` — never the Worker's egress IP. Plausible derives its visitor
hash from UA + IP; forward a CDN address and bot filtering silently drops the event
while still returning `202 Accepted`. The only signal is an `x-plausible-dropped: 1`
response header. Check it and log failures, or a misconfiguration reads as low
traffic rather than as a bug.

The bar for adding any further first-party event is high, and this one clears it
only because the design decision depends on it.

### Opt-out

`/privacy` states plainly what is collected — Plausible's cookieless aggregate
analytics, the grid selection, and search queries with no identifier attached — and
offers a working opt-out.

The opt-out sets a `localStorage` flag that suppresses **both** the Plausible script
and the grid-selection call. Honouring `navigator.doNotTrack` and
`Sec-GPC` as automatic opt-outs is the correct default and costs nothing. The page
must also state that opting out is honoured for the first-party endpoint — a site
that builds a blocker-proof channel and does not say so has done something worse
than the tracking it replaced.

---

## Roadmap beyond v1

### Phase 2–3: MCP server (spec 05)

Expose the gallery as tools to Claude and other AI clients, so someone can ask an
assistant to find empty states and get real results rather than a search-page link.

Cloudflare hosts remote MCP servers natively on Workers via the Agents SDK
(`createMcpHandler`, or `McpAgent` for stateful servers), with Streamable HTTP
transport, deployed to the same account and reading the same D1. Clients connect
directly, or through the `mcp-remote` proxy for those without remote transport.

**Authless is the right posture here.** The catalogue is public, there is nothing to
meter, and monetisation is an explicit non-goal — so OAuth would add a login to a
public reference for no benefit to anyone.

Tools would be thin wrappers over spec 02's query layer:

| Tool | Returns |
|---|---|
| `search_empty_states` | Ranked entries for a query plus facets |
| `get_empty_state` | Full detail for one slug, including screen text |
| `list_facets` | Available devices, OSes, tags, colours with counts |

The design constraint worth stating now: **spec 02's search must be a callable
function, not logic embedded in an Astro route.** If `/api/search` and the MCP tool
call the same function, they cannot disagree. If the MCP server reimplements
search, they will. That is the only thing phase 1 needs to get right for phase 3 to
be cheap.

Deferred deliberately — it is worth building after the corpus is clean and search is
proven, not before.

---

## Cross-cutting conventions

- **IDs are ULIDs** (`ulidx`, already a dependency). Time-sortable, so `ORDER BY id`
  is a valid recency sort.
- **Timestamps are ISO 8601 UTC strings.** SQLite has no date type. `gray-matter`
  returns `Date` objects during legacy migration — `String()` them before binding.
- **`slug` derives from title + app name**, deduplicated with a numeric suffix.
- **Any write to `states`, `state_tags` or `state_colors` rewrites the `states_fts`
  row in the same transaction.** Drift here is the likeliest source of "the tag says
  12 but search says 9".
- **Taxonomies are tables, never enums.** Device types, operating systems and tags
  all grow without a migration.
- **Search is a function first, a route second.** See the MCP note above.

---

## Risks

**Workers AI cost is unmeasured.** The one line in the cost model resting on
assumption rather than published pricing. Measure neuron consumption on the first
hundred ingests and revise. Fallback if it disappoints: run vision only after
deterministic checks pass.

**The legacy tag field is not clean data.** The existing `tags` array conflates three
dimensions — device (`mobile` 392, `desktop` 72), OS (`ios` 64, `android` 64,
`macOS` 12, `macos` 8, `windows` 2) and genuine semantic tags (`permissions`,
`onboarding`, `location`) — and contains junk: entry titles that landed in the tags
array during a past migration ("No downloads in Bitbucket" appears six times *as a
tag*), empty strings, and case-variant duplicates.

The new schema separates these, so migration is a mapping and cleaning pass, not a
copy: an explicit classification table, case normalisation, junk rejection, and a
report of anything unmapped for manual triage. **The most underestimated task in
spec 01.**

**Correction, 2026-08-11.** An earlier draft of this section claimed entry titles had
leaked into the `tags` array. They had not. Those strings live under a separate
`related` key and are legitimate curated data — see `state_relations` above. The tags
array does contain the three conflated dimensions and typos (`browswer`, `mobil`,
`emai`) described here, and the classifier now resolves all 764 tag values across the
corpus with zero unmapped, but nothing was ever corrupt in it.

**Legacy entries break the new rules.** 235 imported entries have alpha channels,
crops outside device ratios, no extracted text. `is_legacy` exempts them from rule
enforcement, but they will look inconsistent until curated. Accepted for v1.

**Two view modes are two layouts to maintain.** Justified and square must agree on
pagination, hover behaviour and keyboard navigation. Mitigation: one card component,
two containers, and the tracking that eventually tells us one can be retired.

**Plausible attribution fails silently.** `202` is returned whether the event landed
or was dropped. Without checking `x-plausible-dropped`, a wrong `X-Forwarded-For`
looks like low traffic.

**Paying changes the failure mode.** On the free plan, exceeding a limit stops the
site. On Paid, it produces a bill. Set Cloudflare billing alerts before launch, and
a Queue consumer `max_retries` low enough that a poisoned message cannot loop
expensively against Workers AI.
