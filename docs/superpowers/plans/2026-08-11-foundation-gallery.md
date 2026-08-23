# Foundation and Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the EMDash-backed site with a plain Astro app on Cloudflare Workers that serves 229 cleanly-migrated legacy entries through a justified-rows gallery and a viewport-filling detail page.

**Architecture:** Astro 6 in server mode on the Cloudflare adapter. D1 holds all content behind a thin query module; R2 serves images from a public bucket so they never invoke the Worker. The gallery renders server-side using a pure-CSS flex approximation of Flickr's justified layout, then hands off to the real module on mount for exact geometry — same result either side, so nothing shifts.

**Tech Stack:** Astro 6, React 19 islands, Tailwind 4, Cloudflare D1 + R2 + Workers, Vitest with `@cloudflare/vitest-pool-workers`, `sharp` for migration-time image measurement, `gray-matter` for frontmatter.

**Spec:** `docs/superpowers/specs/2026-08-11-01-foundation-gallery-design.md`
**Parent:** `docs/superpowers/specs/2026-08-10-emptystates-architecture.md`

## Status

**Tasks 1–8, 10 and 11 complete** (2026-08-19). Next: Task 12, deploy. 146
tests passing.

Tasks 9 and 11A moved to `2026-08-19-pre-launch.md` on 2026-08-19. Both run
after phase 2 and before launch, and neither blocks this deploy.

Every remaining task is filed as an issue, so the public tracker shows what is
left. `v2.0 launch` holds task 12 as [#32](https://github.com/craigmdennis/emptystates/issues/32),
spec 02 as [#33](https://github.com/craigmdennis/emptystates/issues/33), and the
two pre-launch tasks. Submissions and their review queue —
[#34](https://github.com/craigmdennis/emptystates/issues/34) and
[#35](https://github.com/craigmdennis/emptystates/issues/35), specs 03 and 04 —
moved to `v2.1` on 2026-08-19: the first release serves the gallery, search and
the entry pages, and the collection grows by hand until then.

Tasks 6, 7 and 8 were built to the handoff design in
`docs/design-handoff/` rather than to the CSS sketched below — see correction 8.

Issues #26, #27 and #28 are fixed and closed: OS precedence in the classifier,
redirect paths normalised, and a shape check before the middleware's D1 read.
Issues #29 and #30 are open against the toolbar popovers: no light dismiss on
an outside click, and a row radius that should be the outer radius minus the
padding.

**Open Graph cards are rendered from the pre-launch plan**, after phase 2's
ingest path exists. Each card embeds a screenshot keyed by state id and carries
the title and app name, so any re-import or content correction retires every
one of them.

The gallery renders 60 screenshots a page through a bare `Card.astro`. Styling
waits until the functionality underneath it is settled.

`npm run build` and `npx tsc --noEmit` run clean, and `/` and `/s/<slug>` were
confirmed against `npx wrangler dev`. Both render text through `src/db/`;
Tasks 7 and 10 replace them with the real gallery and detail page.

R2 holds 261 display variants over the 235 originals. Set
`PUBLIC_MEDIA_BASE=/img` in `.env` before serving, or images 404.

**Two things Task 6 should expect.** Only 29 states are at least 1280 wide and
5 are at least 2560, so its `srcset` cannot name `w1280` unconditionally —
build the candidate list from `variantsFor(state.width)`. And 8 states are
narrower than 640 and have no variant at all; those fall back to the original.

Eight things the plan got wrong, found by reading the real corpus rather than
trusting the spec. Each is implemented as described here, not as written below.

1. **Task 4's test design could not build.** `test/import.test.ts` imports the
   importer inside the `cloudflare:test` Workers pool, but the module it imports
   uses `fs`, `glob` and `sharp` — a native addon workerd cannot load. Split
   into `read.ts` (Node), `import.ts` (runtime-agnostic), `dedupe.ts` (pure),
   and `types.ts` (the seam, no imports). `scripts/migrate-legacy.ts` joins them
   with `getPlatformProxy()`. Tasks 5–12 are unaffected.

2. **The corpus is 252 entries, not 229.** 235 published, plus 17 directories
   holding only a `.png` with no frontmatter, imported as drafts. Every entry
   exists twice — `<slug>.md` and `<slug>/index.md` — and the pairs are
   byte-identical, so the dedup step is safe. Frontmatter uses `product`, not
   `app_name`, and carries `redirect` (34), `related` (18) and `referral` (3).

3. **`redirect` had nowhere to go** — added `migrations/0007_redirects.sql`.
   The legacy directory name is the live URL, since Gatsby derived `/s/<name>/`
   from it with `createFilePath`. 197 of those names are raw filenames, so they
   get a generated slug plus a `state_redirects` row for the retired path.
   This makes Task 11's fixture check meaningful rather than a mass 404.

4. **`os` is nullable and no longer defaults to `web`.** 153 entries carry no
   OS tag and 134 of those are phones. Task 5's `listFacets` and spec 02's
   search must both treat a null `os` as unknown, not as a filter value.

5. **`writeFtsRow` takes a row, not a state id.** Task 5 specifies
   `writeFtsRow(db, stateId)`, which would have to read the state back to know
   what to index. It shipped with the importer in Task 4 as
   `writeFtsRow(db, row: FtsRow)`, built from values the caller already holds.

6. **`StateRow` carries `byte_size` and `description`.** Task 10's link states
   the original's size, which the plan's own self-review notes and its
   `StateRow` list then omits. Both are selected by the query layer.

7. **`getDb` takes no argument.** Task 5 specifies `getDb(locals)`, and Astro 6
   removed `Astro.locals.runtime.env`:

   ```
   Error: Astro.locals.runtime.env has been removed in Astro v6.
   Use 'import { env } from "cloudflare:workers"' instead.
   ```

   The binding comes off the Workers runtime import, so `getDb()` reads
   `env.DB`. `src/db/client.ts` is the only module under `src/db/` that imports
   `cloudflare:workers`, which keeps the query modules loadable from the Node
   scripts under `scripts/`. The build and the typecheck both pass either way —
   only a request surfaces this.

8. **Tasks 7 and 8 need no island, and no `justified-layout`.** The handoff
   derives justified rows by walking entries, closing a row when
   `sumAspect * target + gap >= width`, then scaling every cell by
   `k = available / (sumAspect * target)`. Flexbox already does exactly that:
   `flex: var(--ar) 1 calc(var(--ar) * var(--row-h))` on a fixed-height cell
   distributes free space in proportion to aspect ratio, so each cell lands at
   `aspect × rowHeight × k` and every cell in a row shares one height. A
   `::after` with a huge `flex-grow` absorbs the last row's slack so a short
   final row sits at target height instead of stretching. No measurement, no
   `ResizeObserver`, no `client:idle` island, and Task 7's `npm install
   justified-layout` is not just skipped but reversed. The same follows for
   Task 8: both layouts are one DOM
   under `[data-view]`, so the switch is a link, and the inline script only
   saves the round trip.

   The facet popover is `<details name="facet">` for the same reason — the
   handoff's document-level `pointerdown` handler, Escape listener and open
   state are all in the element already. What it does not give is light
   dismiss by clicking outside; picking a value navigates, which closes it.

   **Justified cells do not crop**, which the handoff says they should. The
   cell takes `aspect-ratio: var(--ar)` instead of a fixed `--row-h`, so it is
   the same shape as its screenshot and `object-fit` has nothing to remove.
   Row heights then vary a little between rows. Cropping an empty state
   removes the emptiness, which is the thing on display.

   The design of record is `docs/design-handoff/README.md`.

Read `migration-report.md` for what the migration decided and what it refused
to decide.

## Corpus decisions

The corpus is **235 entries**, down from the 252 the importer first read.
Recovering entries from git history took it to 254; a triage pass then removed
19 and retagged 14 after looking at each screenshot. Every entry whose image
shape disagreed with its device now carries an explicit frontmatter `device`,
so that report section is empty and stays empty across re-imports. Facets in
D1: phone 187, desktop 45, tablet 3; ios 32, android 33, web 26, macos 7, with
137 entries carrying no OS.

Rebuild the review page with `npm run triage`; `npm run triage:apply` writes a
session back to the corpus. `docs/device-decisions.json` and
`docs/device-approvals.json` record what was judged.

## Global Constraints

- **Taxonomies are tables, never `CHECK` enums.** `device_types` and `operating_systems` must grow without a migration.
- **Search is a callable function, not route logic.** Nothing in this plan implements search, but nothing may embed query logic in a route that spec 02 would have to duplicate.
- **IDs are ULIDs** via `ulidx` (already a dependency).
- **Timestamps are ISO 8601 UTC strings.** `gray-matter` returns `Date` objects — call `String()` before binding to SQLite.
- **Any write to `states`, `state_tags` or `state_colors` rewrites the `states_fts` row in the same transaction.**
- **Never serve an original as a display image.** Display uses `w640`/`w1280`/`w2560`.
- **Client-derived data is descriptive, never authoritative.**
- **Existing `/s/<slug>` and `/tags/<tag>` URLs must keep resolving.** This is the only failure in this plan that costs real users.
- **Device type values:** `phone`, `tablet`, `desktop`, `tv`, `console`, `watch`.
- **OS values:** `ios`, `android`, `web`, `macos`, `windows`, `linux`.

---

## File Structure

| File | Responsibility |
|---|---|
| `migrations/0001_taxonomies.sql` … `0006_analytics.sql` | Schema, one concern per file |
| `src/db/client.ts` | D1 handle from the Workers runtime; nothing else |
| `src/db/states.ts` | Read queries for gallery and detail |
| `src/db/taxonomies.ts` | Device types, OSes, tags with counts |
| `src/db/fts.ts` | `writeFtsRow()` — the single writer all mutations call |
| `src/lib/slug.ts` | Slug generation and dedup |
| `src/layouts/Base.astro` | Document shell and header; survives Task 5A |
| `src/migrate/classify.ts` | **Pure** tag classifier — device / OS / tag / drop |
| `src/migrate/import.ts` | Reads `content/states/`, writes D1 + R2 |
| `src/migrate/report.ts` | Migration report writer |
| `src/components/Card.astro` | One card, both view modes, later reused by search |
| `src/components/GalleryJustified.astro` | Flex-approximation container + island mount point |
| `src/components/GallerySquare.astro` | Square grid container |
| `src/islands/JustifyLayout.tsx` | Flickr module on mount and resize |
| `src/islands/ViewToggle.tsx` | Mode switch, `localStorage`, beacon |
| `src/pages/index.astro` | Gallery |
| `src/pages/s/[slug].astro` | Detail |
| `src/pages/tags/[tag].astro` | Pre-filtered gallery |
| `src/pages/privacy.astro` | Disclosure and opt-out |
| `src/pages/api/view-pref.ts` | Counter + Plausible forward (pre-launch plan) |
| `src/lib/og/template.ts` | OG card layout — the only place it lives |
| `src/lib/og/render.ts` | satori → SVG → sharp → PNG; Node only, build-time |
| `src/lib/og/assets.ts` | Image bytes → data URI, mime sniffed from magic bytes |
| `scripts/build-og-cards.ts` | Renders a card per state into R2 |
| `src/styles/global.css` | Tokens, grid, card, hairline |

---

## Task 1: Strip EMDash and stand up the test harness

**Files:**
- Modify: `package.json`, `astro.config.mjs`, `wrangler.jsonc`
- Delete: `src/live.config.ts`, `emdash-env.d.ts`, `.emdash/seed.json`
- Create: `vitest.config.ts`, `test/setup.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: a working `npm test`; `env.DB` and `env.MEDIA` bindings available in tests

- [x] **Step 1: Export the current D1 as a rollback**

```bash
npx wrangler d1 export emptystates-db --remote --output=./prod-dump-preflight.sql
ls -la prod-dump-preflight.sql
```

Expected: a non-empty file. `prod-dump.sql` is already gitignored; add `prod-dump-preflight.sql` to `.gitignore` too.

- [x] **Step 2: Remove EMDash packages and files**

```bash
npm uninstall emdash @emdash-cms/cloudflare tesseract.js
rm -f src/live.config.ts emdash-env.d.ts
rm -rf .emdash
```

`tesseract.js` goes too — spec 02 replaces it with Workers AI vision.

- [x] **Step 3: Rewrite `astro.config.mjs`**

```js
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  output: "server",
  adapter: cloudflare(),
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
});
```

- [x] **Step 4: Add the queue bindings to `wrangler.jsonc`**

Declared now so config is stable; unused until spec 02.

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "emptystates",
  "compatibility_date": "2026-08-11",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    { "binding": "DB", "database_name": "emptystates-db",
      "database_id": "a695d0d3-a878-4ada-be03-380fd207c773" }
  ],
  "r2_buckets": [
    { "binding": "MEDIA", "bucket_name": "emptystates-media" }
  ],
  "queues": {
    "producers": [{ "queue": "ingest", "binding": "INGEST" }],
    "consumers": [{ "queue": "ingest", "max_batch_size": 5, "max_retries": 3,
                    "dead_letter_queue": "ingest-dlq" }]
  }
}
```

- [x] **Step 5: Install the test harness**

```bash
npm install -D vitest @cloudflare/vitest-pool-workers
```

- [x] **Step 6: Create `vitest.config.ts`**

```ts
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.jsonc" },
        miniflare: { d1Databases: ["DB"], r2Buckets: ["MEDIA"] },
      },
    },
  },
});
```

- [x] **Step 7: Add the test script to `package.json`**

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [x] **Step 8: Write a failing harness test**

`test/setup.test.ts`:

```ts
import { env } from "cloudflare:test";
import { it, expect } from "vitest";

it("exposes the D1 and R2 bindings to tests", async () => {
  expect(env.DB).toBeDefined();
  expect(env.MEDIA).toBeDefined();
  const { results } = await env.DB.prepare("SELECT 1 AS ok").all();
  expect(results[0].ok).toBe(1);
});
```

- [x] **Step 9: Run it**

Run: `npm test`
Expected: PASS. If it fails on the `emdash` import, a reference survived step 2 — `grep -rn emdash src/ astro.config.mjs` and remove it.

- [x] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: remove EMDash, add Vitest workers harness"
```

---

## Task 2: Schema migrations

**Files:**
- Create: `migrations/0001_taxonomies.sql` through `migrations/0006_analytics.sql`
- Test: `test/schema.test.ts`

**Interfaces:**
- Produces: tables `device_types`, `operating_systems`, `tags`, `states`, `state_tags`, `state_colors`, `states_fts`, `submissions`, `search_log`, `layout_prefs`

- [x] **Step 1: Write the failing schema test**

`test/schema.test.ts`:

```ts
import { env, applyD1Migrations } from "cloudflare:test";
import { it, expect, beforeAll } from "vitest";

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});

it("creates every table", async () => {
  const { results } = await env.DB.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  ).all<{ name: string }>();
  const names = results.map(r => r.name);
  for (const t of ["device_types","operating_systems","tags","states",
                   "state_tags","state_colors","submissions",
                   "search_log","layout_prefs"]) {
    expect(names).toContain(t);
  }
});

it("seeds six device types including tv, console and watch", async () => {
  const { results } = await env.DB
    .prepare("SELECT slug FROM device_types ORDER BY sort_order").all<{ slug: string }>();
  expect(results.map(r => r.slug))
    .toEqual(["phone","tablet","desktop","tv","console","watch"]);
});

it("accepts a new device type without a migration", async () => {
  await env.DB.prepare(
    `INSERT INTO device_types (slug,label,sort_order,is_active,created_at)
     VALUES ('vr','VR headset',7,1,'2026-08-11T00:00:00Z')`
  ).run();
  const row = await env.DB.prepare("SELECT label FROM device_types WHERE slug='vr'")
    .first<{ label: string }>();
  expect(row?.label).toBe("VR headset");
});
```

Add the migrations binding to `vitest.config.ts` `miniflare.bindings`:
`TEST_MIGRATIONS: await readD1Migrations("./migrations")` (import `readD1Migrations` from `@cloudflare/vitest-pool-workers/config`).

- [x] **Step 2: Run it to confirm failure**

Run: `npm test -- schema`
Expected: FAIL — no such table `device_types`.

- [x] **Step 3: Write `migrations/0001_taxonomies.sql`**

```sql
CREATE TABLE device_types (
  slug       TEXT PRIMARY KEY,
  label      TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  is_active  INTEGER NOT NULL DEFAULT 1,
  min_ratio  REAL,
  max_ratio  REAL,
  created_at TEXT NOT NULL
);

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
```

- [x] **Step 4: Write `migrations/0002_states.sql`**

Copy the `states` DDL and its four indexes verbatim from the architecture spec's "Data model" section. `device_type` and `os` are `REFERENCES`, not `CHECK`.

- [x] **Step 5: Write `migrations/0003_relations.sql`, `0004_fts.sql`, `0005_submissions.sql`, `0006_analytics.sql`**

Copy `state_tags`, `state_colors`, `states_fts`, `submissions`, `search_log` and `layout_prefs` verbatim from the architecture spec.

- [x] **Step 6: Run the tests**

Run: `npm test -- schema`
Expected: PASS, all three.

- [x] **Step 7: Apply locally, then remotely**

```bash
npx wrangler d1 migrations apply emptystates-db --local
npx wrangler d1 migrations apply emptystates-db --remote
```

- [x] **Step 8: Commit**

```bash
git add migrations/ vitest.config.ts test/schema.test.ts
git commit -m "feat: add D1 schema migrations with table-backed taxonomies"
```

---

## Task 3: Tag classifier

The highest-risk logic in this plan, isolated as a pure function so it is cheap to test exhaustively.

**Files:**
- Create: `src/migrate/classify.ts`
- Test: `test/classify.test.ts`

**Interfaces:**
- Produces: `classifyTag(raw: string, entryTitle: string): TagVerdict`

```ts
export type TagVerdict =
  | { kind: "device"; value: string }
  | { kind: "os"; value: string }
  | { kind: "tag"; value: string }
  | { kind: "drop"; reason: "empty" | "too-long" | "is-title" }
  | { kind: "unmapped"; raw: string };
```

- [x] **Step 1: Write the failing test**

`test/classify.test.ts` — cases drawn from the real corpus:

```ts
import { classifyTag } from "../src/migrate/classify";
import { it, expect } from "vitest";

it("maps device terms", () => {
  expect(classifyTag("mobile", "x")).toEqual({ kind: "device", value: "phone" });
  expect(classifyTag("desktop", "x")).toEqual({ kind: "device", value: "desktop" });
});

it("maps OS terms and normalises case", () => {
  expect(classifyTag("iOS", "x")).toEqual({ kind: "os", value: "ios" });
  expect(classifyTag("macOS", "x")).toEqual({ kind: "os", value: "macos" });
  expect(classifyTag("macos", "x")).toEqual({ kind: "os", value: "macos" });
  expect(classifyTag("browser", "x")).toEqual({ kind: "os", value: "web" });
});

it("keeps genuine semantic tags", () => {
  expect(classifyTag("onboarding", "x")).toEqual({ kind: "tag", value: "onboarding" });
  expect(classifyTag("permissions", "x")).toEqual({ kind: "tag", value: "permissions" });
});

it("drops empty and whitespace-only tags", () => {
  expect(classifyTag("", "x").kind).toBe("drop");
  expect(classifyTag("   ", "x").kind).toBe("drop");
});

it("drops a tag that is the entry's own title", () => {
  const t = "No downloads in Bitbucket";
  expect(classifyTag(t, t)).toEqual({ kind: "drop", reason: "is-title" });
});

it("drops anything longer than 40 characters", () => {
  expect(classifyTag("a".repeat(41), "x")).toEqual({ kind: "drop", reason: "too-long" });
});

it("reports unknown short tags as unmapped rather than guessing", () => {
  expect(classifyTag("plex", "x")).toEqual({ kind: "unmapped", raw: "plex" });
});
```

- [x] **Step 2: Run to confirm failure**

Run: `npm test -- classify`
Expected: FAIL — cannot find module `classify`.

- [x] **Step 3: Implement `src/migrate/classify.ts`**

```ts
export type TagVerdict =
  | { kind: "device"; value: string }
  | { kind: "os"; value: string }
  | { kind: "tag"; value: string }
  | { kind: "drop"; reason: "empty" | "too-long" | "is-title" }
  | { kind: "unmapped"; raw: string };

const DEVICE: Record<string, string> = {
  mobile: "phone", phone: "phone", iphone: "phone", android: "phone",
  tablet: "tablet", ipad: "tablet",
  desktop: "desktop", laptop: "desktop",
  tv: "tv", console: "console", watch: "watch",
};

const OS: Record<string, string> = {
  ios: "ios", iphone: "ios", ipad: "ios",
  android: "android", samsung: "android",
  web: "web", browser: "web", "progressive web app": "web",
  macos: "macos", osx: "macos", mac: "macos",
  windows: "windows", linux: "linux",
};

const TAGS = new Set([
  "onboarding","error","no-results","no-content","first-run","permissions",
  "location","illustration","text-only","success","upgrade","connection",
  "search","notification","empty-cart","empty-inbox","processing","app",
]);

export function classifyTag(raw: string, entryTitle: string): TagVerdict {
  const trimmed = raw.trim();
  if (!trimmed) return { kind: "drop", reason: "empty" };
  if (trimmed.length > 40) return { kind: "drop", reason: "too-long" };
  if (trimmed.toLowerCase() === entryTitle.trim().toLowerCase())
    return { kind: "drop", reason: "is-title" };

  const key = trimmed.toLowerCase();

  // OS before device: 'android' and 'iphone' are both, and OS is the
  // more specific fact. Device is recoverable from aspect ratio; OS is not.
  if (OS[key]) return { kind: "os", value: OS[key] };
  if (DEVICE[key]) return { kind: "device", value: DEVICE[key] };
  if (TAGS.has(key)) return { kind: "tag", value: key };

  return { kind: "unmapped", raw: trimmed };
}
```

- [x] **Step 4: Run the tests**

Run: `npm test -- classify`
Expected: PASS. Note `classifyTag("android")` returns `os`, and the importer separately derives `device_type` from aspect ratio — the ordering comment explains why.

- [x] **Step 5: Commit**

```bash
git add src/migrate/classify.ts test/classify.test.ts
git commit -m "feat: add pure tag classifier for legacy migration"
```

---

## Task 4: Legacy importer

**Files:**
- Create: `src/migrate/import.ts`, `src/migrate/report.ts`, `src/lib/slug.ts`
- Test: `test/import.test.ts`, `test/slug.test.ts`

**Interfaces:**
- Consumes: `classifyTag` from Task 3
- Produces: `slugify(title: string, appName: string): string`, `dedupeSlug(base: string, taken: Set<string>): string`, `importLegacy(opts): Promise<MigrationReport>`

- [x] **Step 1: Write the failing slug test**

`test/slug.test.ts`:

```ts
import { slugify, dedupeSlug } from "../src/lib/slug";
import { it, expect } from "vitest";

it("slugifies title and app name", () => {
  expect(slugify("No results", "Feedly")).toBe("no-results-in-feedly");
});

it("strips punctuation and collapses whitespace", () => {
  expect(slugify("You're all done!", "Sunrise")).toBe("youre-all-done-in-sunrise");
});

it("appends a numeric suffix on collision", () => {
  const taken = new Set(["no-results-in-feedly"]);
  expect(dedupeSlug("no-results-in-feedly", taken)).toBe("no-results-in-feedly-2");
});
```

- [x] **Step 2: Run to confirm failure**

Run: `npm test -- slug`
Expected: FAIL — module not found.

- [x] **Step 3: Implement `src/lib/slug.ts`**

```ts
export function slugify(title: string, appName: string): string {
  const base = appName ? `${title} in ${appName}` : title;
  return base
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function dedupeSlug(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
```

- [x] **Step 4: Run the slug tests**

Run: `npm test -- slug`
Expected: PASS.

- [x] **Step 5: Write the failing importer test**

`test/import.test.ts` — uses a fixture directory, not the real corpus:

```ts
import { env, applyD1Migrations } from "cloudflare:test";
import { it, expect, beforeAll } from "vitest";
import { importLegacy } from "../src/migrate/import";

beforeAll(async () => { await applyD1Migrations(env.DB, env.TEST_MIGRATIONS); });

it("imports an entry, splitting device, OS and tags", async () => {
  const report = await importLegacy({
    db: env.DB, bucket: env.MEDIA, dir: "test/fixtures/states", dryRun: false,
  });

  expect(report.imported).toBe(1);
  const row = await env.DB
    .prepare("SELECT slug, device_type, os, is_legacy, width, height, aspect_ratio FROM states")
    .first<any>();

  expect(row.device_type).toBe("phone");
  expect(row.os).toBe("android");
  expect(row.is_legacy).toBe(1);
  expect(row.width).toBeGreaterThan(0);
  expect(row.aspect_ratio).toBeCloseTo(row.width / row.height, 5);

  const { results: tags } = await env.DB.prepare(
    `SELECT t.slug FROM tags t JOIN state_tags st ON st.tag_id = t.id`
  ).all<{ slug: string }>();
  expect(tags.map(t => t.slug)).not.toContain("mobile");
  expect(tags.map(t => t.slug)).not.toContain("android");
});

it("records unmapped tags in the report instead of inventing a mapping", async () => {
  const report = await importLegacy({
    db: env.DB, bucket: env.MEDIA, dir: "test/fixtures/states", dryRun: true,
  });
  expect(report.unmappedTags).toContain("plex");
});
```

Create `test/fixtures/states/no-content-in-plex/index.md` with frontmatter
`title`, `date`, `image`, and `tags: [mobile, android, no-content, plex, ""]`,
plus a small real PNG beside it.

- [x] **Step 6: Run to confirm failure**

Run: `npm test -- import`
Expected: FAIL — module not found.

- [x] **Step 7: Implement `src/migrate/import.ts`**

Algorithm, in order:

1. Glob `<dir>/*.md` and `<dir>/*/index.md`.
2. Deduplicate: prefer the directory form; compare image bytes before discarding the flat file.
3. `gray-matter` each file. `String(data.date)` before use.
4. `classifyTag` each entry in `data.tags`, collecting device, OS, tags, unmapped.
5. Read image dimensions with `sharp`. Compute `aspect_ratio = width / height`.
6. Derive `device_type` when classification produced none, by matching `aspect_ratio` against `device_types.min_ratio`/`max_ratio`; record a report entry when this fires.
7. Default `os` to `web` when absent; record a report entry.
8. `slugify` + `dedupeSlug`; prefer the existing directory name when it is already a valid slug, so current URLs survive.
9. `PUT` the image to R2 at `originals/<ulid>.<ext>`.
10. Insert `states` with `is_legacy = 1`, then `tags`/`state_tags`.
11. Call `writeFtsRow()` (Task 5) in the same batch.

`dryRun: true` performs every step except the R2 and D1 writes.

- [x] **Step 8: Implement `src/migrate/report.ts`**

```ts
export type MigrationReport = {
  imported: number;
  skippedDuplicateFiles: string[];
  unmappedTags: string[];
  derivedDeviceFrom: { slug: string; ratio: number; chose: string }[];
  defaultedOs: string[];
  missingImages: string[];
  aspectOutsideAllRanges: { slug: string; ratio: number }[];
};

export function formatReport(r: MigrationReport): string { /* markdown table per section */ }
```

- [x] **Step 9: Run the importer tests**

Run: `npm test -- import`
Expected: PASS both.

- [x] **Step 10: Dry-run against the real corpus and read the report**

```bash
npx tsx scripts/migrate-legacy.ts --dry-run > migration-report.md
```

`scripts/migrate-legacy.ts` is a thin CLI wrapper calling `importLegacy` against a local D1 via `wrangler d1 execute --local`.

**Read `migration-report.md` before continuing.** Every unmapped tag must be either added to `TAGS`/`DEVICE`/`OS` in Task 3 or consciously dropped. This is the step whose whole purpose is to make the decisions visible; skipping it silently defaults them.

- [x] **Step 11: Run for real, locally**

```bash
npx tsx scripts/migrate-legacy.ts
npx wrangler d1 execute emptystates-db --local \
  --command "SELECT COUNT(*) AS n, SUM(device_type IS NULL) AS no_device, SUM(os IS NULL) AS no_os FROM states"
```

Expected: `n` equals unique markdown entries; `no_device` and `no_os` both 0.

- [x] **Step 12: Commit**

```bash
git add src/migrate/ src/lib/slug.ts test/ scripts/migrate-legacy.ts
git commit -m "feat: add legacy importer with tag classification and report"
```

---

## Task 5: Query layer and FTS writer

**Files:**
- Create: `src/db/client.ts`, `src/db/states.ts`, `src/db/taxonomies.ts`, `src/db/fts.ts`
- Test: `test/states.test.ts`

**Interfaces:**
- Produces:
  - `getDb(): D1Database`
  - `listStates(db, { page, perPage, device?, os?, tag? }): Promise<{ rows: StateRow[]; total: number }>`
  - `getStateBySlug(db, slug): Promise<StateRow | null>`
  - `getAdjacent(db, publishedAt): Promise<{ prev: StateRow | null; next: StateRow | null }>`
  - `listFacets(db): Promise<{ devices: Facet[]; oses: Facet[]; tags: Facet[] }>`
  - `writeFtsRow(db, stateId): D1PreparedStatement[]`

`StateRow` includes `id, slug, title, app_name, app_url, device_type, os, r2_key, width, height, aspect_ratio, published_at, submitter_name, submitter_handle`.

- [x] **Step 1: Write the failing test**

```ts
it("lists published states newest first with a total", async () => {
  const { rows, total } = await listStates(env.DB, { page: 1, perPage: 2 });
  expect(rows).toHaveLength(2);
  expect(total).toBeGreaterThan(2);
  expect(rows[0].published_at >= rows[1].published_at).toBe(true);
});

it("returns aspect_ratio so the gallery never measures images", async () => {
  const { rows } = await listStates(env.DB, { page: 1, perPage: 1 });
  expect(rows[0].aspect_ratio).toBeGreaterThan(0);
});

it("facet counts never include a zero-count option", async () => {
  const { devices } = await listFacets(env.DB);
  expect(devices.every(d => d.count > 0)).toBe(true);
});
```

- [x] **Step 2: Run to confirm failure**

Run: `npm test -- states`
Expected: FAIL — module not found.

- [x] **Step 3: Implement the four modules**

`listStates` filters on `status = 'published'`, orders by `published_at DESC`, and uses `LIMIT`/`OFFSET`. `listFacets` counts via `GROUP BY` joined to the taxonomy tables, returning only rows with a count above zero.

`writeFtsRow` returns prepared statements rather than executing, so callers can include them in the same `db.batch()` as their own writes — which is how "same transaction" is enforced rather than merely requested.

- [x] **Step 4: Run the tests**

Run: `npm test -- states`
Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add src/db/ test/states.test.ts
git commit -m "feat: add D1 query layer and FTS row writer"
```

---

## Task 5A: Remove the EMDash-era components

Task 1 removed the `emdash` package but left the components that called it, so
`npm run build` has failed since then:

```
[vite]: Rollup failed to resolve import "emdash" from "src/pages/s/[slug].astro"
```

Tasks 6–10 write replacements under different names, so nothing later in this
plan deletes the old files or notices they are still there. Until the build
runs, no task from 6 onward can be verified in a browser, and Task 11's fixture
check cannot run at all.

Numbered 5A so that every "Task N" reference elsewhere in this plan keeps
pointing at the same task.

**Files:**
- Delete: `src/components/{DetailMeta,FilterBar,Gallery,GalleryCard,Pagination}.astro`, `src/components/{FocusModeToggle,SearchIsland,ZoomIsland}.tsx`
- Modify: `src/layouts/Base.astro`
- Replace: `src/pages/index.astro`, `src/pages/s/[slug].astro`

**Interfaces:**
- Consumes: `getDb` from Task 5, `listStates` and `getStateBySlug` from Task 5
- Produces: a green `npm run build`; two routes reading D1, which Tasks 7 and 10 rewrite

- [x] **Step 1: Confirm what still depends on what**

```bash
grep -rn "emdash" src/
grep -rn "SearchIsland\|ZoomIsland\|GalleryCard\|FilterBar\|Pagination\|DetailMeta\|FocusModeToggle" src/
```

Expected: `emdash` in the two pages only. `Base.astro` imports `SearchIsland`,
and `GalleryCard.astro` imports `ZoomIsland`; every other component is reached
only through `index.astro` or `s/[slug].astro`.

`Base.astro` and `src/styles/global.css` both survive. Task 6 rewrites the
stylesheet as design tokens, and search returns in spec 02 as a query against
`states_fts`, which Task 4 already populates.

- [x] **Step 2: Delete the eight components**

```bash
git rm src/components/DetailMeta.astro src/components/FilterBar.astro \
       src/components/Gallery.astro src/components/GalleryCard.astro \
       src/components/Pagination.astro src/components/FocusModeToggle.tsx \
       src/components/SearchIsland.tsx src/components/ZoomIsland.tsx
```

`SearchIsland.tsx` is also the only file `npx tsc --noEmit` reports an error in,
so the typecheck goes clean with it.

- [x] **Step 3: Drop the search island from `Base.astro`**

Remove the `SearchIsland` import and the element that mounts it. Keep the
`global.css` import, the document shell and the header.

The header's device nav linked to `?device=mobile` and `?device=game`, matching
no slug in `device_types`, so both returned an empty gallery. They are `phone`
and `console`. Task 6 rebuilds the bar from `listFacets`, which can only offer
a device something published carries.

- [x] **Step 4: Point both routes at the query layer**

Neither page is the real thing — Task 7 writes the gallery and Task 10 the
detail page. Each renders text off `src/db/` so the build compiles and the
query layer is exercised through a real request. Images are left out on
purpose: R2 serves them from a public host that does not resolve locally, and
the `w640`/`w1280`/`w2560` derivatives do not exist until spec 02.

```astro
---
// src/pages/index.astro
import Layout from "../layouts/Base.astro";
import { getDb } from "../db/client";
import { listStates } from "../db/states";

const page = Number(Astro.url.searchParams.get("page") ?? 1);
const { rows, total } = await listStates(getDb(), {
  page,
  perPage: 60,
});
---
<Layout title="EmptyStates">
  <p>{total} states</p>
  <ul>{rows.map((s) => (
    <li><a href={`/s/${s.slug}`}>{s.title}</a> — {s.device_type}</li>
  ))}</ul>
</Layout>
```

`s/[slug].astro` calls `getStateBySlug` and returns a 404 response when it
resolves to null.

- [x] **Step 5: Verify**

```bash
npm run build
npx tsc --noEmit
grep -rn "emdash" src/ || echo "no emdash references remain"
npm test
```

Expected: the build completes, the typecheck is silent, the grep finds nothing,
and the test count is unchanged — no test covers these files.

- [x] **Step 6: Commit**

```bash
git add -A src/
git commit -m "refactor: remove the EMDash-era components, read routes from D1"
```

---

## Task 5B: Display variants

Task 6's card points `src` and `srcset` at `w640/<id>.webp` and `w1280/<id>.webp`.
R2 holds 235 objects, all under `originals/`, and spec 02 owns generating the
variants — no task in this plan does. Task 6 step 3 asks for a manual check at
three viewports, and every image would 404.

CLS measures zero either way, because the card emits `width` and `height` from
the stored dimensions and the browser reserves the box before loading anything.
So the check as written passes against 235 empty frames.

Pulls step 3 of spec 02's ingest pipeline forward, unchanged: WebP at 640,
1280 and 2560 wide, quality 82, never upscaled. Spec 02 calls the same function
when a submission arrives.

Generated variants are still unreachable from `wrangler dev` — Task 5C covers
that.

**Files:**
- Create: `src/lib/variants.ts`, `scripts/build-variants.ts`
- Test: `test/variants.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `listStates` from Task 5, the `MEDIA` binding
- Produces: `w640/`, `w1280/`, `w2560/` in R2

- [x] **Step 1: Write the failing tests**

```ts
// Never upscale: a 900px-wide original gets w640 only.
expect(variantsFor(900)).toEqual([640]);
expect(variantsFor(1280)).toEqual([640, 1280]);
expect(variantsFor(640)).toEqual([640]);
expect(variantsFor(500)).toEqual([]);   // smaller than every variant
```

A 500px original is a real case — `tumblr_mh8v21c0YA1rdf37to1_400` is 400 wide.
`srcset` falls back to the largest variant that exists, so an entry with none
uses its original.

- [x] **Step 2: Write `src/lib/variants.ts`**

`variantsFor(width)` returns the widths to write, and `variantKey(width, id)`
returns where each lives. Pure, so the never-upscale rule is testable without
R2, and spec 02's upload path calls the same two functions.

- [x] **Step 3: Write `scripts/build-variants.ts`**

```bash
npx tsx scripts/build-variants.ts --dry-run
npx tsx scripts/build-variants.ts
npx tsx scripts/build-variants.ts --only <slug>
```

Same shape as `scripts/migrate-legacy.ts`: `getPlatformProxy()` for `DB` and
`MEDIA`, page through `listStates`, read `originals/<id>.<ext>`, write each
variant with `sharp(...).resize(w).webp({ quality: 82 })`. Skip a variant that
already exists unless `--force`, so a re-run after adding one entry costs one
render.

Originals are never modified.

- [x] **Step 4: Verify**

```bash
npm test
npx wrangler r2 object get emptystates-media/w640/<id>.webp --local --file /tmp/v.webp
npx sharp --version >/dev/null; file /tmp/v.webp
```

Expected: a WebP 640 wide. Count the objects written against the number of
published states at least 640 wide.

- [x] **Step 5: Commit**

```bash
git add src/lib/variants.ts scripts/build-variants.ts test/variants.test.ts package.json
git commit -m "feat: generate WebP display variants from the originals in R2"
```

---

## Task 5C: Reach R2 from a local server

`img.emptystat.es` is an R2 custom domain, so it resolves in production only.
Task 5B's variants are in the bucket and invisible to `wrangler dev`, which
leaves every task from 6 onward unverifiable at the one thing they are about.

The architecture requires that images never invoke the Worker. That holds in
production, where `PUBLIC_MEDIA_BASE` is unset and every URL points at the
bucket's own domain. Development sets it to `/img` and reads the same objects
through the `MEDIA` binding.

One helper decides the base, so no template carries a conditional and no task
after this one has to think about which environment it renders in.

**Files:**
- Create: `src/lib/media.ts`, `src/pages/img/[...key].ts`
- Test: `test/media.test.ts`
- Modify: `.dev.vars` (gitignored), `README.md`

**Interfaces:**
- Consumes: the `MEDIA` binding
- Produces: `mediaUrl(key)` — the only way any template names an image

- [x] **Step 1: Write the failing test**

```ts
expect(mediaUrl("w640/abc.webp")).toBe("https://img.emptystat.es/w640/abc.webp");
expect(mediaUrl("w640/abc.webp", "/img")).toBe("/img/w640/abc.webp");
```

Cover a base with a trailing slash and a key with a leading one; the two
concatenated naively give `//`, which resolves to a different origin in a
browser instead of failing loudly.

- [x] **Step 2: Write `src/lib/media.ts`**

`mediaUrl(key)` returns `${base}/${key}`, with the base read from
`PUBLIC_MEDIA_BASE` and falling back to `https://img.emptystat.es`.

- [x] **Step 3: Write `src/pages/img/[...key].ts`**

Reads the `MEDIA` binding, returns 404 for a missing key, and sets
`Content-Type` from the object's stored metadata with a long `Cache-Control`.
`export const prerender = false`.

- [x] **Step 4: Point development at it**

```
# .env — gitignored
PUBLIC_MEDIA_BASE=/img
```

`.env` and not `.dev.vars`. Astro inlines `import.meta.env.PUBLIC_*` at build
time from `.env`; `.dev.vars` populates the Worker's own `env`, which is a
different object. The Workers test pool reads both, so a test of `mediaBase()`
passes under either and hides the difference — which is why `resolveBase` is
the pure half and the tested one.

Production leaves the variable unset. Note it in `README.md`: a missing `.env`
renders a working page with broken images, which reads as a data problem
instead of a configuration one.

- [x] **Step 5: Verify**

```bash
npm test
npm run build
npx wrangler dev
curl -sI http://localhost:8787/img/w640/<id>.webp
```

Expected: `200` and `content-type: image/webp`.

- [x] **Step 6: Commit**

```bash
git add src/lib/media.ts src/pages/img test/media.test.ts README.md
git commit -m "feat: serve R2 objects locally so images resolve in development"
```

---

## Task 6: Card component and design tokens

**Split.** The card renders the screenshot and nothing else, and every styled
part below is deferred until the functionality underneath is settled. Task 7
takes the tokens, since `--ar` and `--row-h` exist for the geometry it builds;
Task 8 takes the hover metadata and the view modes.

`src/lib/images.ts` is the part that had to be right first. `imageSources`
builds the candidate list from `variantsFor(state.width)`, so a card asks only
for objects Task 5B wrote — the `srcset` sketched below names `w1280` for every
card, which would 404 for 206 of 235 states.

Done for the bare card, unchecked below for the rest.

**Files:**
- Create: `src/components/Card.astro` (bare), `src/lib/images.ts`, `src/styles/global.css` (deferred to Task 7)
- Test: `test/images.test.ts`; the styled card is manual, at three viewports

**Interfaces:**
- Consumes: `StateRow` from Task 5, `variantsFor` from Task 5B, `mediaUrl` from Task 5C
- Produces: `<Card state={row} />` now; `view="justified" | "square"` in Task 8

- [ ] **Step 1: Write `src/styles/global.css`**

```css
:root {
  --stone: #e6e2db; --rule: #c7c1b6; --card: #fff;
  --ink: #17150f; --muted: #6d675d; --accent: #a8431a;
  --hdr: 118px; --hdr-detail: 56px; --rows: 2;
  --row-h: calc((100dvh - var(--hdr)) / var(--rows) - 1px);
}

.gallery { background: var(--rule); }
.rows { display: flex; flex-wrap: wrap; gap: 1px; }

.cell { position: relative; background: var(--card); overflow: hidden; }
.cell img { display: block; width: 100%; height: 100%; }

[data-view="justified"] .cell {
  aspect-ratio: var(--ar);
  flex: var(--ar) 1 calc(var(--ar) * var(--row-h));
}
[data-view="justified"] .cell img { object-fit: cover; }

[data-view="square"] .rows {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--row-h), 1fr));
}
[data-view="square"] .cell {
  aspect-ratio: 1;
  padding: clamp(14px, 2.2vw, 28px);
}
[data-view="square"] .cell img { object-fit: contain; }

@media (max-width: 900px) { :root { --hdr: 110px; } }
@media (max-width: 620px) { :root { --hdr: 104px; --rows: 1.5; } }
```

The `--rows: 1.5` on small screens is deliberate: a half-row peeking at the bottom tells the eye there is more without costing a full row of height.

- [ ] **Step 2: Write `src/components/Card.astro`**

```astro
---
const { state, view } = Astro.props;
const ar = (state.width / state.height).toFixed(4);
const base = `https://img.emptystat.es`;
---
<a class="cell" style={`--ar:${ar}`} href={`/s/${state.slug}`}>
  <img
    src={`${base}/w640/${state.id}.webp`}
    srcset={`${base}/w640/${state.id}.webp 640w, ${base}/w1280/${state.id}.webp 1280w`}
    sizes={view === "square" ? "(max-width:620px) 50vw, 25vw" : "auto"}
    width={state.width}
    height={state.height}
    alt={state.title}
    loading="lazy"
    decoding="async"
  />
  <div class="meta">
    <div class="app">{state.app_name}</div>
    <div class="sub">{state.os} · {state.device_type}</div>
  </div>
</a>
```

`width` and `height` are always emitted from stored dimensions. That is the entire reason `aspect_ratio` is denormalised onto `states` — the browser reserves space before any image loads.

- [ ] **Step 3: Verify manually**

Run: `npm run dev`, open `/`, check at 390px, 1280px, 2560px.
Expected: cards render, no console errors, no layout shift as images load (DevTools → Performance → check CLS is 0).

- [ ] **Step 4: Commit**

```bash
git add src/components/Card.astro src/styles/global.css
git commit -m "feat: add card component and design tokens"
```

---

## Task 7: Justified gallery with no layout shift

**Files:**
- Create: `src/components/GalleryJustified.astro`, `src/islands/JustifyLayout.tsx`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `Card`, `listStates`
- Produces: `<GalleryJustified states={rows} />`

- [ ] **Step 1: Install the layout module**

```bash
npm install justified-layout
```

- [ ] **Step 2: Write `src/components/GalleryJustified.astro`**

Server-renders the flex approximation — the CSS in Task 6 already produces it — and mounts the island:

```astro
---
import Card from "./Card.astro";
import JustifyLayout from "../islands/JustifyLayout.tsx";
const { states } = Astro.props;
---
<div class="gallery" data-view="justified">
  <div class="rows" id="rows">
    {states.map(s => <Card state={s} view="justified" />)}
    <span class="tail"></span>
  </div>
</div>
<JustifyLayout client:idle />
```

- [ ] **Step 3: Write `src/islands/JustifyLayout.tsx`**

```tsx
import { useEffect } from "react";
import justifiedLayout from "justified-layout";

export default function JustifyLayout() {
  useEffect(() => {
    const rows = document.getElementById("rows");
    if (!rows) return;

    const layout = () => {
      const cells = Array.from(rows.querySelectorAll<HTMLElement>(".cell"));
      const ratios = cells.map(c => parseFloat(c.style.getPropertyValue("--ar")));
      const cs = getComputedStyle(document.documentElement);
      const targetRowHeight = parseFloat(cs.getPropertyValue("--row-h"));

      const result = justifiedLayout(ratios, {
        containerWidth: rows.clientWidth,
        containerPadding: 0,
        boxSpacing: 1,
        targetRowHeight,
        targetRowHeightTolerance: 0.25,
        showWidows: true,
      });

      cells.forEach((cell, i) => {
        const box = result.boxes[i];
        if (!box) return;
        cell.style.flex = "none";
        cell.style.width = `${box.width}px`;
        cell.style.height = `${box.height}px`;
      });
    };

    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(rows);
    return () => ro.disconnect();
  }, []);

  return null;
}
```

The flex approximation and the module produce the same geometry, so taking over on mount moves nothing. `client:idle` rather than `client:load` because the server render is already correct — this is a refinement, not a requirement for first paint.

- [ ] **Step 4: Wire `src/pages/index.astro`**

Call `listStates` with `page` from `Astro.url.searchParams`, pass rows to `GalleryJustified`.

- [ ] **Step 5: Verify no layout shift**

Run: `npm run dev`, open DevTools → Performance, reload with network throttled to Slow 3G.
Expected: CLS 0. If cards jump when the island mounts, the flex basis and the module disagree — check `boxSpacing` matches the CSS `gap` of 1px.

- [ ] **Step 6: Commit**

```bash
git add src/components/GalleryJustified.astro src/islands/JustifyLayout.tsx src/pages/index.astro package.json
git commit -m "feat: add justified gallery with SSR flex approximation"
```

---

## Task 8: Square mode and the view toggle

**Files:**
- Create: `src/components/GallerySquare.astro`, `src/islands/ViewToggle.tsx`
- Modify: `src/pages/index.astro`, `src/layouts/Base.astro`

**Interfaces:**
- Produces: `<ViewToggle initial="justified" | "square" />`

- [ ] **Step 1: Write `src/components/GallerySquare.astro`**

Identical to `GalleryJustified` but `data-view="square"`, no island, no `tail`.

- [ ] **Step 2: Add the anti-flash inline script to `Base.astro`**

In `<head>`, before any stylesheet:

```html
<script is:inline>
  try {
    var v = localStorage.getItem("es:view");
    if (v === "square" || v === "justified") {
      document.documentElement.dataset.view = v;
    }
  } catch (e) {}
</script>
```

Blocking and inline on purpose. Deferred, it would run after first paint and the visitor would see the wrong layout flash to the right one.

- [ ] **Step 3: Write `src/islands/ViewToggle.tsx`**

Two buttons. On click: set `document.documentElement.dataset.view` and write `localStorage`. The `navigator.sendBeacon("/api/view-pref", ...)` call arrives with the endpoint, in the pre-launch plan.

`sendBeacon` rather than `fetch` — it survives the page being navigated away from, which is exactly when someone toggles and immediately clicks an entry.

- [ ] **Step 4: Make `index.astro` render whichever container matches**

Server-side, read `?view=` first, then fall back to `justified`. The inline script corrects to the stored preference before paint.

- [ ] **Step 5: Verify**

Run: `npm run dev`. Toggle, reload.
Expected: mode persists, no flash of the other layout, both modes render at 390px and 1280px.

- [ ] **Step 6: Commit**

```bash
git add src/components/GallerySquare.astro src/islands/ViewToggle.tsx src/layouts/Base.astro src/pages/index.astro
git commit -m "feat: add square view mode and persisted view toggle"
```

---

## Task 9: `/api/view-pref` and the Plausible forward

**Moved to `2026-08-19-pre-launch.md`, task 1** (2026-08-19). Tracked as
[#36](https://github.com/craigmdennis/emptystates/issues/36). It runs after
phase 2, before launch. Its only caller is the layout switch, which flips
`data-view` and stores the choice without reporting it, so nothing here waits
on it. `/privacy` already describes the endpoint, so its behaviour is fixed by
that page.

---

## Task 10: Detail page

**Files:**
- Create: `src/pages/s/[slug].astro`
- Test: `test/detail.test.ts`

**Interfaces:**
- Consumes: `getStateBySlug`, `getAdjacent`

- [ ] **Step 1: Write the failing test**

```ts
it("returns 404 for an unknown slug", async () => {
  const res = await SELF.fetch("https://x/s/does-not-exist");
  expect(res.status).toBe(404);
});

it("links the original with rel=noopener and never serves it as the display image", async () => {
  const html = await (await SELF.fetch("https://x/s/no-content-in-plex")).text();
  expect(html).toMatch(/rel="noopener noreferrer"/);
  expect(html).toMatch(/href="[^"]*\/originals\//);
  expect(html).not.toMatch(/<img[^>]+src="[^"]*\/originals\//);
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `npm test -- detail`
Expected: FAIL — 404 on both, or route missing.

- [ ] **Step 3: Implement the page**

```astro
<figure class="detail-figure">
  <img
    src={`${base}/w1280/${state.id}.webp`}
    srcset={`${base}/w1280/${state.id}.webp 1280w, ${base}/w2560/${state.id}.webp 2560w`}
    width={state.width} height={state.height} alt={state.title} />
</figure>

<a href={`${base}/originals/${state.id}.${ext}`} target="_blank" rel="noopener noreferrer">
  Open original — {state.width} × {state.height}, {formatBytes(state.byte_size)}
</a>
```

```css
.detail-figure {
  height: calc(100dvh - var(--hdr-detail));
  display: grid;
  place-items: center;
}
.detail-figure img {
  max-width: 100%; max-height: 100%;
  width: auto; height: auto;
}
```

`max-*` with `width: auto` rather than `object-fit`: the `<img>` box shrinks to the picture, so the caption and focus ring track what is actually visible.

Metadata sits below, with its top edge visible at the bottom of the viewport — apply `margin-top: -32px` to the meta strip's container or reduce the figure height by the same amount, so the page does not end exactly at the fold.

- [ ] **Step 4: Run the tests**

Run: `npm test -- detail`
Expected: PASS both.

- [ ] **Step 5: Verify manually**

Open a phone entry (0.5 ratio) and a desktop entry (1.7 ratio) at 390px and 2560px.
Expected: whole image visible without scrolling in all four combinations; metadata peeks at the bottom.

- [ ] **Step 6: Commit**

```bash
git add src/pages/s/ test/detail.test.ts
git commit -m "feat: add detail page filling viewport with original link"
```

---

## Task 11: Tag pages, privacy page, and URL preservation

**Two corrections, both found by running it.**

Nothing served `state_redirects`. The task names no file for it, and step 5
says a 404 means fixing the importer's slug preference — but the 180 renamed
slugs were deliberate and already have redirect rows. `src/middleware.ts`
serves them, checking after the response so a live route always wins.

The fixture command reads the working tree, which no longer holds the 18
entries removed during triage. `test/fixtures/legacy-urls.json` is generated
from `master`'s `content/states` instead — the URLs the live site publishes —
and separates those 18, which 404 by decision.

**Open finding, belongs to Task 3.** `classifyTag` takes the first OS verdict
it sees, with no precedence among OS values, so tag order decides. Three
entries carry both a web-ish and a concrete OS tag, and two lost the concrete
one: `unable-to-connect-to-youtube-website` is `web` from `browser` when its
tags say `windows`, and `new-page-in-notion` the same over `macos`. `/tags/windows`
therefore renders empty. A precedence rule preferring a named platform over
`web` fixes both, and needs the migration re-run.

**Files:**
- Create: `src/pages/tags/[tag].astro`, `src/pages/privacy.astro`
- Test: `test/urls.test.ts`

- [x] **Step 1: Write the failing URL preservation test**

```ts
import legacySlugs from "./fixtures/legacy-slugs.json";

it("every pre-existing /s/ URL still resolves", async () => {
  for (const slug of legacySlugs) {
    const res = await SELF.fetch(`https://x/s/${slug}`);
    expect(res.status, `/s/${slug}`).toBe(200);
  }
});

it("every pre-existing tag page still resolves", async () => {
  for (const tag of ["mobile", "desktop", "ios", "android"]) {
    const res = await SELF.fetch(`https://x/tags/${tag}`);
    expect(res.status, `/tags/${tag}`).toBe(200);
  }
});
```

Generate the fixture from git before starting:

```bash
git show master:gatsby-node.js > /dev/null && \
ls content/states | grep -v '\.md$' | jq -R -s 'split("\n")|map(select(length>0))' \
  > test/fixtures/legacy-slugs.json
```

- [x] **Step 2: Run to confirm failure**

Run: `npm test -- urls`
Expected: FAIL — most slugs 404.

- [x] **Step 3: Implement `/tags/[tag].astro`**

Legacy tags include device and OS values (`mobile`, `ios`) that are no longer tags. Resolve in order: tag table, then device type, then OS — so `/tags/mobile` maps to a device filter and keeps working.

- [x] **Step 4: Implement `/privacy.astro`**

Must state: Plausible cookieless aggregate analytics; the grid selection sent to a first-party endpoint **and that this is not blocked by ad blockers**; search queries stored with no identifier. Opt-out button sets `localStorage["es:optout"]`; `Base.astro` checks it before loading the Plausible script or calling `/api/view-pref`, and treats `navigator.doNotTrack === "1"` or `navigator.globalPrivacyControl` as opted out.

- [x] **Step 5: Run the tests**

Run: `npm test -- urls`
Expected: PASS. Any 404 is a slug the importer renamed — fix the importer's slug preference in Task 4 step 7 item 8, re-run the migration, re-test.

- [x] **Step 6: Run the full suite**

Run: `npm test`
Expected: all PASS.

- [x] **Step 7: Commit**

```bash
git add src/pages/tags/ src/pages/privacy.astro test/urls.test.ts test/fixtures/
git commit -m "feat: add tag pages and privacy opt-out, preserve legacy URLs"
```

---

## Task 11A: Open Graph card per state

**Moved to `2026-08-19-pre-launch.md`, task 2** (2026-08-19). Tracked as
[#37](https://github.com/craigmdennis/emptystates/issues/37). It runs after
phase 2, before launch. Each card embeds a screenshot keyed by state id and
carries the title and app name, so the ingest path phase 2 adds — which mints
ids and can retitle entries — has to be in place before 235 cards are rendered
against the current set. Until then `/s/<slug>` unfurls without an image.

---

## Task 12: Deploy and verify against the spec checklist

Tracked as [#32](https://github.com/craigmdennis/emptystates/issues/32).

- [x] **Step 1: Apply migrations to remote D1**

```bash
npx wrangler d1 migrations apply emptystates-db --remote
```

- [x] **Step 2: Run the migration against remote**

Point `scripts/migrate-legacy.ts` at `--remote` and run. Confirm counts match the local run.

**Run it once.** Every run mints fresh ULIDs and puts a new set of originals
without deleting the previous set, so a second run doubles the objects in the
bucket and orphans the first set — nothing references them, and nothing removes
them. Seven local runs left 1,738 objects under `originals/` against 235 rows.
Before re-running against remote for any reason, list the bucket and delete the
keys no `states.r2_key` names.

- [x] **Step 2a: Generate the display variants against remote**

```bash
npx tsx scripts/build-variants.ts
```

- [ ] **Step 2b: Open Graph cards**

Deferred to `2026-08-19-pre-launch.md`, task 2. `/s/<slug>` unfurls without an
image until then.

- [ ] **Step 3: Deploy**

```bash
npm run build && npx wrangler deploy
```

- [x] **Step 4: Confirm no EMDash reference survived**

```bash
grep -rn "emdash\|EmDash\|EMDash" src/ astro.config.mjs wrangler.jsonc package.json \
  || echo "clean"
```

Expected: `clean`. Task 1 removed the package and Task 5A removed the
components that called it; this catches anything reintroduced since.

- [ ] **Step 5: Walk the spec's verification checklist**

Open `docs/superpowers/specs/2026-08-11-01-foundation-gallery-design.md` §7 and tick every box against the deployed site, not against localhost. Items needing the real deployment: R2 URLs resolving over `img.emptystat.es`, Plausible receiving the event without `x-plausible-dropped`, and every legacy URL resolving.

- [ ] **Step 6: Commit and tag**

```bash
git add -A && git commit -m "chore: deploy foundation and gallery"
git tag foundation-complete
```

---

## Self-Review

**Spec coverage.** §1 remove EMDash → Tasks 1 and 5A. §2 schema → Task 2. §3 legacy migration → Tasks 3–4. §4 gallery → Tasks 6–8. §5 detail page → Tasks 10 and 11A. §6 analytics endpoints and privacy → Tasks 9, 11. §7 verification → Task 12.

**Gap found and closed.** No task gave a detail page an `og:image`, so every
`/s/` link would unfurl blank. The pre-launch plan renders one card per state, following
`~/Sites/craigmdennis.com/src/lib/og/`. That site renders at build time in a
static endpoint; this one cannot, because no native addon loads in workerd.
Cards are rendered in Node and served from R2, and `sharp` rasterises the SVG
in place of the other site's `@resvg/resvg-js`, which would duplicate a
dependency the migration already uses.

**Gap found and closed.** §1's "remove EMDash" was mapped to Task 1 alone, which
uninstalls the package. Eight components and two pages import it, and Tasks
6–10 write replacements under new names without deleting them, so the build
would have stayed broken through every remaining task. Task 5A removes them.

**Gap found and closed.** The spec's §4 mentions `--rows` as a responsive token but never fixes its values; Task 6 sets 2 / 2 / 1.5 across the three breakpoints, with the reasoning for the half-row.

**Gap found and closed.** `byte_size` is used by Task 10's original link but is not on `states` in the architecture spec — it is on `submissions` only. **Add `byte_size INTEGER` to `states` in migration 0002**, populated by the importer from the file on disk. Without it the link cannot state its size, which is the reason the label exists.

**Type consistency.** `StateRow` is defined in Task 5 and consumed by Tasks 6, 7, 8, 10. `classifyTag`/`TagVerdict` defined in Task 3, consumed in Task 4. `writeFtsRow` returns statements rather than executing, and Task 4 step 7 item 11 relies on that — consistent.

**No placeholders.** Task 4 steps 7–8 describe an algorithm rather than showing full code, because the importer is ~200 lines of glue; every step is enumerated in order with its inputs and outputs named, and the two functions it depends on are fully specified in Tasks 3 and 5.
