# 01 — Foundation and gallery

**Date:** 2026-08-11
**Parent:** `2026-08-10-emptystates-architecture.md`
**Depends on:** nothing
**Phase:** 1

Everything here inherits the parent's stack, schema, compute model and conventions.

## Scope

Strip EMDash, stand up the schema, migrate 235 legacy entries cleanly, and build
the gallery in both view modes with the detail page. No submissions, no search
beyond simple facet filtering, no admin.

At the end of this spec the site is a working, faster replacement for what exists
today, with clean data underneath it. Search and submissions build on top.

**Out of scope:** ingest pipeline and full-text search (02), submission form (03),
admin (04).

---

## 1. Remove EMDash

| Action | Target |
|---|---|
| Uninstall | `emdash`, `@emdash-cms/cloudflare` |
| Delete | `src/live.config.ts`, `emdash-env.d.ts`, `.emdash/` |
| Edit | `astro.config.mjs` — drop the `emdash()` integration, keep `cloudflare()`, `react()`, `tailwindcss()` |
| Replace | every `getEmDashCollection` / `getEmDashEntry` call with a D1 query |
| Add | `queues` producer + consumer bindings to `wrangler.jsonc` (unused until 02, declared now so config is stable) |

`d1_databases` and `r2_buckets` bindings stay exactly as they are. The database and
bucket are already provisioned and already hold the migrated content.

**Wipe and re-seed rather than migrate in place.** The existing D1 tables were
created by EMDash's own migration runner against its schema. Reshaping them into
the new model is more work than re-importing from `content/states/`, which remains
the source of truth and is in git. Export the current D1 state first as a rollback.

---

## 2. Schema

Apply the parent document's DDL as numbered migrations under `migrations/`, run via
`wrangler d1 migrations apply`. Order matters — taxonomies before `states`, `states`
before the join tables, FTS last.

```
0001_taxonomies.sql        device_types, operating_systems, tags
0002_states.sql            states + indexes
0003_relations.sql         state_tags, state_colors
0004_fts.sql               states_fts
0005_submissions.sql       submissions (unused until 03)
0006_analytics.sql         search_log, layout_prefs
```

Seed `device_types` with `phone`, `tablet`, `desktop`, `tv`, `console`, `watch` and
`operating_systems` with `ios`, `android`, `web`, `macos`, `windows`, `linux`.

`min_ratio` / `max_ratio` on `device_types`, from measured reality plus headroom:

| Device | min | max |
|---|---|---|
| phone | 0.40 | 0.65 |
| tablet | 0.65 | 1.50 |
| desktop | 1.20 | 2.20 |
| tv | 1.50 | 2.40 |
| console | 1.50 | 2.40 |
| watch | 0.70 | 1.30 |

Ranges overlap deliberately. They are a sanity check that flags a mismatch for
review, never a rejection — a claimed `desktop` at 0.5 is worth a second look, not
an automatic refusal.

---

## 3. Legacy migration

**The largest and most underestimated task in this spec.** Budget accordingly.

229 unique entries across `content/states/*.md` and `content/states/*/index.md`.
Frontmatter shape: `title`, `date`, `image`, `tags[]`, optional `product`,
`referral`, `redirect`.

### The tag problem

One `tags` array conflates three dimensions and contains junk. Measured counts:

| Value | Count | Actually is |
|---|---|---|
| `mobile` | 392 | device |
| `desktop` | 72 | device |
| `ios` | 64 | OS |
| `android` | 64 | OS |
| `browser` | 50 | OS (→ `web`) |
| `macOS` / `macos` | 12 / 8 | OS, case-variant duplicates |
| `permissions`, `onboarding`, `location`, `error` | 8, 8, 8, 4 | genuine tags |
| `No downloads in Bitbucket` and similar | 6 | **entry titles, wrongly in tags** |
| `""` | 6 | junk |

### Migration algorithm

1. **Parse** every markdown file with `gray-matter`. `String()` all dates — it
   returns `Date` objects, which SQLite will not bind.
2. **Deduplicate.** Many entries exist both as `<slug>.md` and `<slug>/index.md`.
   Prefer the directory form; verify the image is byte-identical before discarding.
3. **Classify each tag** against an explicit mapping table, lowercased and trimmed:
   - device terms → `device_type`
   - OS terms → `os` (`browser` → `web`, `macOS` → `macos`)
   - known semantic tags → `state_tags`
   - empty, or longer than 40 characters, or matching the entry's own title → drop
   - anything else → **leave unmapped and report**
4. **Derive `device_type` when absent** from the image's aspect ratio against
   `device_types` ranges. Fall back to `desktop` only with a report entry.
5. **Read image dimensions** with `sharp`; store `width`, `height`, `aspect_ratio`.
6. **Copy the image to R2** under `originals/<ulid>.<ext>`.
7. **Set `is_legacy = 1`** on every row.
8. **Emit a migration report**: unmapped tags, entries with no device or OS,
   duplicate slugs, missing images, aspect ratios outside every device range.

`screen_text`, `description` and colours are **not** populated here. Those come from
the ingest pipeline in 02, which re-processes the legacy corpus as backfill.

### Gates

The migration is correct when: row count matches unique markdown files; every row
has a `device_type` and an `os`; no tag is an entry title; no empty tags; every
`r2_key` resolves; and the report has been read and its unmapped tags either mapped
or deliberately dropped.

**The report is not optional output.** Its whole purpose is to make the decisions
visible rather than silently defaulting them.

---

## 4. Gallery

### The card

One component, used by both view modes and later by search results. Props: entry
row plus a `view` discriminator. It renders a link to `/s/<slug>`, a `<picture>`
with the `w640`/`w1280` variants, and hover metadata (app name, OS, device, first
tag).

`width` and `height` attributes are always set from the stored dimensions, so the
browser reserves space before the image loads. This is the whole reason
`aspect_ratio` is denormalised onto `states`.

### Justified mode

Flickr's `justified-layout` module, client-side, recomputed on resize as decided.

```js
justifiedLayout(aspectRatios, {
  containerWidth,
  containerPadding: 0,
  boxSpacing: 1,
  targetRowHeight,          // see below
  targetRowHeightTolerance: 0.25,
  showWidows: true,
})
```

`targetRowHeight` is **derived from viewport height, not fixed**:

```css
--row-h: calc((100dvh - var(--hdr)) / var(--rows) - 1px);
```

`--rows` defaults to 2 and is a responsive token. Rows-per-screen is the setting;
card size is the consequence. A fixed pixel target was tried and rejected — at
0.5 aspect, a row height that fits two rows on screen produces phone cards too
narrow to read, and the two constraints have to be traded explicitly rather than
discovered.

**No layout shift.** Server-renders the pure-CSS flex approximation, which produces
the same geometry:

```css
.cell { aspect-ratio: var(--ar); flex: var(--ar) 1 calc(var(--ar) * var(--row-h)); }
```

Within a row, flex-grow proportional to aspect ratio distributes free space in the
same proportion as flex-basis, so every item scales by an identical factor and
heights stay equal. The module then takes over on mount and on resize for exact
tolerance and widow handling. Same geometry either side, so nothing moves.

### Square mode

```css
.rows { display: grid; gap: 1px;
        grid-template-columns: repeat(auto-fill, minmax(var(--row-h), 1fr)); }
.cell { aspect-ratio: 1; padding: clamp(14px, 2.2vw, 28px); }
.cell img { object-fit: contain; }
```

Padding is required, not decoration: without it a contained image touches the
hairline and the card stops reading as a frame.

### Chrome

White cards on a hairline grid — the grid container carries the rule colour and
cards sit on it. No gaps: a screenshot already contains its own internal margins,
and a gutter outside that padding reads as one oversized double-space. This is why
gaps were removed and a 1px rule used instead.

Header is two compact lines (~118px): wordmark, search field, view toggle, Submit;
then device pills, active filter chips, match count. OS, colour, tags and sort sit
behind an **Advanced** disclosure. Every pixel of header comes out of the rows.

### View preference

- Default is **justified** — it needs no crop and absorbs legacy content whose
  aspect ratios predate the submission rules.
- Persisted per visitor in `localStorage`, and honoured on first paint from an
  inline script to avoid a flash of the wrong layout.
- Each toggle fires `POST /api/view-pref` (section 6).

Persistence biases the counts toward whatever someone picked once. Accepted: a
preference that resets every session is worse for the visitor, and the `viewport`
property gives enough signal without it.

---

## 5. Detail page — `/s/<slug>`

### The image fills the viewport

The screenshot is the page. It occupies the full viewport height less the header,
contained rather than cropped, so the whole screen is visible without scrolling
whatever its aspect ratio.

```css
.detail-figure {
  height: calc(100dvh - var(--hdr-detail));
  display: grid;
  place-items: center;
}
.detail-figure img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;         /* contain, without object-fit letterboxing the box itself */
}
```

`--hdr-detail` is the detail page's own header, which is **not** the gallery
header — no facet bar, no view toggle, no search. Back link, wordmark, and the
original link. Roughly 56px against the gallery's 118px, and every pixel saved is
given to the image.

Sizing via `max-width`/`max-height` with `width: auto` rather than `object-fit`
matters here: the `<img>` box shrinks to the image, so the caption and any focus
ring track the actual picture rather than an invisible container that is wider than
what is displayed.

**Which variant.** `w1280` at 1× covers a viewport-fit desktop screenshot and a 2×
phone screenshot. `w2560` is served via `srcset` for large or high-density displays,
generated in 02 only when the original is at least that wide. The original is never
the display image — it can be several megabytes, and this is a page people open
repeatedly while browsing.

### Open the original

A link beside the image, opening in a new tab:

```html
<a href="https://img.emptystat.es/originals/<id>.<ext>"
   target="_blank" rel="noopener noreferrer">
  Open original — 1170 × 2532, 1.4 MB
</a>
```

Dimensions and file size are shown because they are the reason someone follows the
link. A designer opening the original wants to inspect at pixel level or download a
reference, and both decisions depend on knowing what arrives. An unlabelled "view
full size" on a 6 MB PNG over mobile data is a small hostile act.

`rel="noopener noreferrer"` is required, not decoration — R2 serves on a different
subdomain, and `target="_blank"` without it hands the opened page a reference back to
this one.

### Below the fold

Because the image takes the viewport, metadata sits below it. That is the intended
trade, but it must be *discoverable*: leave the metadata strip's top edge visible at
the bottom of the viewport rather than starting it exactly at the fold. A page that
ends precisely at the viewport edge reads as finished, and people do not scroll it.

Below: app name linked to `app_url`, device, OS, tags as links, capture date,
submitter attribution when present, previous/next by `published_at`, and — once 02
populates it — screen text in a collapsed `<details>` block, which doubles as an
accessibility aid.

Legacy `/tags/<tag>` URLs are preserved as pre-filtered gallery views.

---

## 6. Analytics endpoints

### `POST /api/view-pref`

Body: `{ view, viewport }`. The Worker:

1. `INSERT ... ON CONFLICT DO UPDATE` the `layout_prefs` counter for `(view, day)`.
2. Inside `ctx.waitUntil()`, forwards a `View Mode` event to Plausible with props
   `{ view, viewport }`.

The forward **must** carry the visitor's raw `User-Agent` and `X-Forwarded-For` set
from `CF-Connecting-IP`. Plausible hashes UA + IP for its visitor identity; a
Worker egress IP gets the event dropped by bot filtering, still returns `202`, and
signals only via `x-plausible-dropped: 1`. Check that header and log failures —
otherwise a misconfiguration reads as low traffic rather than a bug.

Rate-limit per IP. This endpoint is unauthenticated and writes to D1.

### `/privacy`

States plainly what is collected: Plausible's cookieless aggregate analytics, the
grid selection via a first-party endpoint, and search queries stored with no
identifier. It must say explicitly that the grid-selection call is first-party and
not blocked by ad blockers — building a blocker-proof channel and staying quiet
about it would be worse than the tracking it replaces.

Opt-out sets a `localStorage` flag suppressing **both** the Plausible script and
`/api/view-pref`. `navigator.doNotTrack` and `Sec-GPC` are honoured automatically.

---

## 7. Verification

- [ ] `emdash` absent from `package.json`, `node_modules`, and the config
- [ ] All six migrations apply cleanly to a fresh local D1
- [ ] Migration report reviewed; no unmapped tags remain unresolved
- [ ] Row count equals unique markdown entries; every row has device and OS
- [ ] No tag is an entry title; no empty tags
- [ ] Every `r2_key` resolves over `img.emptystat.es`
- [ ] Both view modes render at 360px, 768px, 1280px, 2560px
- [ ] No cumulative layout shift on gallery load — verify in DevTools, do not assume
- [ ] View preference survives reload with no flash of the wrong layout
- [ ] Detail page image fits the viewport without scrolling, at 0.47 and 1.78
      aspect ratios, on a 390px phone and a 2560px display
- [ ] Metadata strip peeks above the fold rather than starting exactly at it
- [ ] "Open original" opens in a new tab, carries `rel="noopener noreferrer"`,
      and states the real dimensions and file size
- [ ] Detail page serves `w1280`/`w2560`, never the original as display image —
      confirm in the network trace
- [ ] `/api/view-pref` increments D1 **and** Plausible shows the event without
      `x-plausible-dropped`
- [ ] Opt-out suppresses both the script and the endpoint
- [ ] Every pre-existing `/s/<slug>` and `/tags/<tag>` URL still resolves

That last item is the one that costs real users if missed.
