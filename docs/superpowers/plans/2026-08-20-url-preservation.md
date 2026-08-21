# URL Preservation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every URL the live Gatsby site publishes resolves after the v2 cutover, either at the same address or through one 301, and every filtered view names one canonical address.

**Architecture:** The page number moves out of the query string and into the path, which is the shape master already publishes — `/2`, `/tags/mobile/2`. Filters stay in the query string, with the selected tags in one comma-separated `tag` parameter. Two rest routes replace the two current gallery routes, so neither the index body nor the tag body is written twice. A canonical builder reduces any address to the pathname plus an allowlist of filter parameters, which removes `view` and `open` from the index without removing them from the interface.

**Tech Stack:** Astro 7 in server mode on the Cloudflare adapter, D1 behind `src/db/`, Vitest with `@cloudflare/vitest-pool-workers`.

**Spec:** `docs/superpowers/specs/2026-08-11-01-foundation-gallery-design.md` §7, extended by the master-to-v2 comparison recorded below.

## Global Constraints

- Astro 7.2.3, `@astrojs/cloudflare` 14.2.2, wrangler floor `^4.83.0`. The Rust compiler collapses template whitespace by JSX rules — anything separating two runs of text is a box, never a character.
- `trailingSlash: "never"` in `astro.config.mjs`, set by Task 1. Astro's default is `'ignore'`, under which `/2` and `/2/` both answer 200 and one page holds two addresses. Under `'never'`, an on-demand rendered URL carrying a trailing slash receives a 301 to the slashless form for a GET, and a 308 for any other method. Master published every URL with a trailing slash, so each of those becomes one redirect rather than a second live address.
- No new dependency. Every step below uses `URL`, `URLSearchParams` and what is already imported.
- Tests run in the Workers pool except where a step says otherwise. `npm test` is the whole suite; `npm test -- <name>` runs one file.
- 149 tests pass before this plan starts. Every task ends with the full suite green.

## The URL grammar this plan establishes

| Address | Meaning |
|---|---|
| `/` | Gallery, page 1, unfiltered |
| `/2`, `/3`, `/4` | Gallery, pages 2 and up, unfiltered |
| `/?device=phone&tag=onboarding,error` | Gallery, page 1, filtered |
| `/3?device=phone` | Gallery, page 3, filtered |
| `/tags/mobile` | 301 to `/?device=phone` |
| `/tags/mobile/2` | 301 to `/2?device=phone` |
| `/s/<slug>` | One entry |
| `/privacy` | Privacy page |

Two rules cover every address:

1. A page number is a path segment. `?page=` never appears.
2. A filter is a query parameter. Any path form of a filter redirects to the query form, so `/tags/mobile` reaches `/?device=phone` and stops there.

Every address above is slashless, and `trailingSlash: "never"` 301s the slashed form to it. Master publishes the slashed form throughout, so `/tags/mobile/` reaches `/tags/mobile` through one redirect.

This follows [Google's ecommerce URL structure guidance](https://developers.google.com/search/docs/specialty/ecommerce/designing-a-url-structure-for-ecommerce-sites) on three points it states directly:

- "Use `?key=value` URL parameters rather than `?value`, where possible." Every filter here is `device=`, `os=` or `tag=`.
- "Make sure each page in paginated results has a unique URL." Tasks 2 and 3 give each page one address, and both routes 301 the `/1` form that would be a second address for page one.
- "Minimize alternative URLs that return the same content." `trailingSlash: "never"` removes one such pair per address, and `canonicalPath` removes the rest.

That page also records where this most often goes wrong: "We see the most URL mistakes in pagination URL structures."

## What master publishes, and where each URL lands

| Master URL | Count | After this plan |
|---|---|---|
| `/`, `/2`, `/3`, `/4` | 4 | Same address, real route (Task 2) |
| `/tags/<slug>/` | 40 | 301 to the filter, through `resolveTagPath` (Task 3) |
| `/tags/mobile/2`–`/4` | 3 | 301 to `/N?device=phone` (Task 3) |
| `/s/<dir>/` where the slug survived | 54 | Same address |
| `/s/<dir>/` where the importer renamed it | 173 | 301 from `state_redirects` |
| `/s/<dir>/` retired during triage | 8 | 301 to `/` (Task 4) |
| `/post/<id>/<slug>` from `redirect` frontmatter | 33 | 301 from `state_redirects` |

54 plus 173 plus 8 is master's 235 published entries. The `/post/` rows are inbound Tumblr addresses rather than pages Gatsby builds, so they sit outside that total.

Counts come from the local D1: 235 published states, 213 redirect rows (180 `/s/` and 33 `/post/`), 25 tags. Seven of the 180 name directories holding only a `.png` on master, which is why 173 of them serve an address Gatsby publishes. `device/phone` holds 187 entries, so `/tags/mobile` still has four pages after the migration, the same as master's `mobile` tag at 196.

Reproduce the three counts at any time:

```bash
npx wrangler d1 execute emptystates-db --local --json \
  --command "SELECT slug FROM states WHERE status='published'" > /tmp/slugs.json
```

then compare against `git ls-tree -r master --name-only | grep '/index.md$'`.

## File structure

- `src/lib/canonical.ts` — **new.** One pure function reducing a `URL` to the address that should appear in `rel=canonical`.
- `src/lib/pagination.ts` — **new.** One pure function parsing a path segment into a page number, and one building a pager href.
- `src/pages/[...page].astro` — **new**, replaces `src/pages/index.astro`. Matches `/` and `/N`.
- `src/pages/tags/[...rest].astro` — **new**, replaces `src/pages/tags/[tag].astro`. Matches `/tags/<x>` and `/tags/<x>/N`, and redirects both.
- `src/components/Pagination.astro` — **modified.** Emits path hrefs.
- `src/layouts/Base.astro` — **modified.** Canonical from the new builder.
- `astro.config.mjs` — **modified.** `trailingSlash: "never"`.
- `src/lib/query.ts` — **modified.** `toggleParam` writes one comma-separated `tag`, and `readList` reads it back.
- `src/components/Toolbar.astro` — **modified.** Reads tags through `readList`.
- `src/db/redirects.ts` — **modified.** A static set for the 8 retired entries.
- `test/canonical.test.ts`, `test/pagination.test.ts`, `test/legacy-urls.test.ts` — **new.**
- `test/urls.test.ts`, `test/classify.test.ts` — **modified.** Assert that no tag slug names a device or an operating system.
- `test/fixtures/legacy-urls.json` — **modified.** Gains the paginated addresses.

---

## Task 1: Canonical address builder

The index currently builds `canonicalUrl` from `Astro.url.pathname` alone, so `/?device=phone` and `/?view=square` both claim `/` as their canonical. The first loses a real filtered view from the index; the second is the duplicate this task removes.

**Files:**
- Create: `src/lib/canonical.ts`
- Modify: `src/layouts/Base.astro:26-30`, `astro.config.mjs`
- Test: `test/canonical.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `canonicalPath(url: URL): string` — a path plus, at most, a normalised query string. Consumed by `Base.astro` only.

- [x] **Step 1: Write the failing test**

```ts
import { it, expect } from "vitest";
import { canonicalPath } from "../src/lib/canonical";

const at = (href: string) => canonicalPath(new URL(href, "https://emptystat.es"));

it("keeps the parameter that names one indexable facet", () => {
  expect(at("/?device=phone")).toBe("/?device=phone");
  expect(at("/?os=ios")).toBe("/?os=ios");
});

// `view` is the layout and `open` reopens a popover. Neither changes the
// entries on the page, so both would put a second address in the index.
it("drops display state", () => {
  expect(at("/?view=square")).toBe("/");
  expect(at("/?open=tag")).toBe("/");
});

it("drops display state from an indexable facet view", () => {
  expect(at("/?device=phone&view=square")).toBe("/?device=phone");
  expect(at("/?os=ios&open=tag")).toBe("/?os=ios");
});

// Tags ride as one comma-separated value, so `tag` appears once. Google's
// ecommerce URL page states "Avoid using the same parameters twice. Googlebot
// may ignore one of the values otherwise."
it("orders tags inside the one parameter, which the toolbar appends in click order", () => {
  expect(at("/?tag=onboarding,error")).toBe("/");
  expect(at("/tags/mobile?tag=onboarding,error")).toBe("/tags/mobile");
});

it("drops a tag value stated twice", () => {
  expect(at("/?tag=error,error")).toBe("/");
});

// Three devices and five operating systems, each with enough entries to read
// as a page. 20 of the 25 tags carry one entry, so a tag view repeats a
// detail page and points at the gallery instead.
it("keeps one device or one operating system", () => {
  expect(at("/?device=phone")).toBe("/?device=phone");
  expect(at("/?os=ios")).toBe("/?os=ios");
  expect(at("/2?device=phone")).toBe("/2?device=phone");
});

it("sends a tag view to the gallery it filters", () => {
  expect(at("/?tag=onboarding")).toBe("/");
  expect(at("/3?tag=onboarding")).toBe("/3");
});

it("sends a combination of facets to the gallery", () => {
  expect(at("/?device=phone&os=ios")).toBe("/");
  expect(at("/?device=phone&tag=error")).toBe("/");
});

// Master published every URL with a trailing slash and `trailingSlash` is
// 'ignore', so both forms reach the route. One of them is the canonical.
it("strips a trailing slash, keeping the root as a slash", () => {
  expect(at("/2/")).toBe("/2");
  expect(at("/tags/mobile/")).toBe("/tags/mobile");
  expect(at("/")).toBe("/");
});

it("ignores a parameter no facet uses", () => {
  expect(at("/?utm_source=twitter&fbclid=x")).toBe("/");
});

it("leaves a detail page alone", () => {
  expect(at("/s/no-deals-yet")).toBe("/s/no-deals-yet");
});
```

- [x] **Step 2: Run to confirm failure**

Run: `npm test -- canonical`
Expected: FAIL — cannot resolve `../src/lib/canonical`.

- [x] **Step 3: Implement `src/lib/canonical.ts`**

```ts
/**
 * The one address a page claims in `rel=canonical`.
 *
 * Three parameters change which entries a gallery returns, and everything
 * else is either display state or somebody's tracking. Filtering to an
 * allowlist means a new parameter cannot add a second indexable address for a
 * page that already has one.
 *
 * The page number is a path segment, so nothing here handles it.
 */

/** Parameters that change the result set. Order fixed, so output is stable. */
const FILTERS = ["device", "os", "tag"] as const;

/**
 * The facet views search engines should index: the bare gallery, one device,
 * or one operating system.
 *
 * The corpus has 3 devices (phone 187, desktop 45, tablet 3) and 5 operating
 * systems (android 33, ios 32, web 24, macos 8, windows 1). It has 25 tags,
 * and 20 of them carry a single entry, so a tag view repeats one detail page.
 * A combination of two facets is a search somebody runs and not a page they
 * arrive at.
 */
function isIndexable(entries: [string, string][]): boolean {
  if (entries.length === 0) return true;
  if (entries.length > 1) return false;
  return entries[0][0] === "device" || entries[0][0] === "os";
}

export function canonicalPath(url: URL): string {
  const entries: [string, string][] = [];

  for (const key of FILTERS) {
    const raw = url.searchParams.get(key);
    if (!raw) continue;
    // One comma-separated value, sorted and de-duplicated, so two click
    // orders produce one address.
    const values = [
      ...new Set(raw.split(",").map((v) => v.trim()).filter(Boolean)),
    ].sort();
    if (values.length) entries.push([key, values.join(",")]);
  }

  let path = url.pathname;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);

  if (!isIndexable(entries)) return path;

  // Built by hand: `URLSearchParams.toString` percent-encodes the comma as
  // `%2C`, and the toolbar's links carry it literally. Two spellings of one
  // address is what this function exists to remove.
  const search = entries
    .map(([k, v]) => `${k}=${v.split(",").map(encodeURIComponent).join(",")}`)
    .join("&");

  return search ? `${path}?${search}` : path;
}
```

- [x] **Step 4: Run the tests**

Run: `npm test -- canonical`
Expected: PASS, 8 tests.

- [x] **Step 5: Set `trailingSlash: "never"`**

Add the option to `astro.config.mjs`, above `output`:

```js
export default defineConfig({
  // One address per page. Under Astro's default of 'ignore', `/2` and `/2/`
  // both answer 200 and the canonical is all that separates them. Under
  // 'never', the slashed form receives a 301 to the slashless one — a GET
  // gets 301 and any other method 308, both permanent.
  //
  // Master publishes every URL with a trailing slash, so this is the rule
  // that turns each of those into a redirect rather than a duplicate.
  trailingSlash: "never",
  output: "server",
  adapter: cloudflare(),
  vite: {
    plugins: [tailwindcss()],
  },
});
```

`canonicalPath` keeps stripping the slash as well. The two are not redundant: the redirect governs what a request receives, and the canonical governs what a page claims about itself when something reaches it another way.

- [x] **Step 6: Wire it into `Base.astro`**

Replace lines 26–30:

```astro
const canonicalUrl = new URL(
  Astro.url.pathname,
  Astro.site ?? "https://emptystat.es",
);
```

with:

```astro
const canonicalUrl = new URL(
  canonicalPath(Astro.url),
  Astro.site ?? "https://emptystat.es",
);
```

and add to the imports at the top of the frontmatter:

```astro
import { canonicalPath } from "../lib/canonical";
```

`Base.astro` needs no `canonical` prop. Every address on the site computes its
own, because no two live addresses render the same list: Task 3 redirects the
legacy tag paths instead of serving them.

- [x] **Step 7: Run the full suite**

Run: `npm test`
Expected: PASS, 157 tests.

- [ ] **Step 8: Confirm the two-hop chain on a legacy entry address**

Astro applies the slash redirect before the middleware. `handleRequest` in
`node_modules/astro/dist/core/routing/handler.js:38` calls `handleTrailingSlash`
and returns its response immediately. `render(state)`, which calls
`handleMiddleware`, is reached only when that returns nothing.

So a renamed entry arriving in master's published form takes two redirects:

1. `/s/tumblr_mggrayiCsC1rdf37to1_1280/` → 301 → `/s/tumblr_mggrayiCsC1rdf37to1_1280`, from `handleTrailingSlash`.
2. `/s/tumblr_mggrayiCsC1rdf37to1_1280` → 301 → `/s/no-deals-yet`, from `src/middleware.ts`.

This applies to all 173 renamed entries and all 33 `/post/` addresses, since
every inbound link from the old site carries the trailing slash. The middleware
cannot answer first, so removing the second hop would mean setting
`trailingSlash: "ignore"` and accepting a duplicate address on every live page.
Keep `"never"` and keep the two hops.

`handleTrailingSlash` preserves the query string — `location: redirect + url.search`
at line 28 of `trailing-slash-handler.js` — so `/2/?device=phone` reaches
`/2?device=phone` with the filter intact. It also returns the pathname unchanged
for `/`, so the root never redirects to itself.

Confirm against a build, since the development server prints a warning page
instead of redirecting:

```bash
npm run build && npx wrangler dev
```

```bash
curl -sIL http://localhost:8787/s/tumblr_mggrayiCsC1rdf37to1_1280/ \
  | grep -i '^HTTP/\|^location:'
```

Expected: two `301` lines, then `200`.

- [x] **Step 9: Commit**

```bash
git add src/lib/canonical.ts test/canonical.test.ts src/layouts/Base.astro \
        astro.config.mjs
git commit -m "feat: one address per page, canonical and trailing slash"
```

---

## Task 1A: One `tag` parameter carrying a comma-separated value

`toggleParam` appends a repeated `tag=` pair per selection, and three readers call `getAll("tag")`. Google's ecommerce URL page states: "Avoid using the same parameters twice. Googlebot may ignore one of the values otherwise."

**Files:**
- Modify: `src/lib/query.ts:44-56`, `src/components/Toolbar.astro:34`, `src/pages/[...page].astro`, `src/pages/tags/[...rest].astro`
- Test: `test/query.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `toggleParam(url, key, value)` keeps its signature and writes one comma-separated value. `readList(url, key): string[]` is new, and both gallery routes read tags through it.

- [x] **Step 1: Write the failing test**

Append to `test/query.test.ts`:

```ts
import { readList, toggleParam } from "../src/lib/query";

const at = (search: string) => new URL(`https://x/${search}`);

it("adds a first tag as one parameter", () => {
  expect(toggleParam(at(""), "tag", "error")).toBe("/?tag=error");
});

it("appends a second tag to the same parameter", () => {
  expect(toggleParam(at("?tag=error"), "tag", "onboarding")).toBe(
    "/?tag=error,onboarding",
  );
});

it("removes one tag and keeps the rest", () => {
  expect(toggleParam(at("?tag=error,onboarding"), "tag", "error")).toBe(
    "/?tag=onboarding",
  );
});

it("removes the parameter when the last tag goes", () => {
  expect(toggleParam(at("?tag=error"), "tag", "error")).toBe("/");
});

// Narrowing from page 3 of a longer result set lands past the end of a
// shorter one, so a selection returns to the base path.
it("drops the page segment by returning the base path", () => {
  expect(toggleParam(new URL("https://x/3?tag=error"), "tag", "onboarding")).toBe(
    "/?tag=error,onboarding",
  );
});

it("reads the value back as a list", () => {
  expect(readList(at("?tag=error,onboarding"), "tag")).toEqual([
    "error",
    "onboarding",
  ]);
  expect(readList(at(""), "tag")).toEqual([]);
  expect(readList(at("?tag="), "tag")).toEqual([]);
});
```

- [x] **Step 2: Run to confirm failure**

Run: `npm test -- query`
Expected: FAIL — `toggleParam` returns `/?tag=error&tag=onboarding`, and `readList` does not exist.

- [x] **Step 3: Rewrite `toggleParam` and add `readList`**

Replace the `toggleParam` block in `src/lib/query.ts`:

```ts
/**
 * Reads a comma-separated parameter back as a list.
 *
 * Tags combine, and Google's ecommerce URL guidance asks that one parameter
 * appear once, so the values ride in a single `tag=` pair.
 */
export function readList(url: URL, key: string): string[] {
  const raw = url.searchParams.get(key);
  if (!raw) return [];
  return raw.split(",").map((v) => v.trim()).filter(Boolean);
}

/**
 * Adds or removes one value of a comma-separated parameter, for multi-select
 * tags.
 *
 * `withParams` sets a parameter to a single value, which is right for device
 * and OS — one of each. Each row in the tag popover is the link that flips its
 * own value inside the one `tag` parameter.
 *
 * The page resets to the base path: narrowing from page 3 of a longer result
 * set lands past the end of a shorter one.
 */
export function toggleParam(url: URL, key: string, value: string): string {
  const current = readList(url, key);
  const values = current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];

  const next = new URL(url);
  if (values.length) next.searchParams.set(key, values.join(","));
  else next.searchParams.delete(key);

  // The page number is a path segment, so returning to page 1 means dropping
  // it from the path.
  const base = next.pathname.replace(/\/\d+$/, "") || "/";

  const search = [...next.searchParams]
    .map(([k, v]) => `${k}=${v.split(",").map(encodeURIComponent).join(",")}`)
    .join("&");

  return search ? `${base}?${search}` : base;
}
```

- [x] **Step 4: Run the tests**

Run: `npm test -- query`
Expected: PASS, including the six cases added.

- [x] **Step 5: Change the three readers**

In `src/components/Toolbar.astro`, replace line 34:

```astro
const selectedTags = url.searchParams.getAll("tag");
```

with:

```astro
const selectedTags = readList(url, "tag");
```

and add `readList` to the existing import from `../lib/query`.

In `src/pages/[...page].astro` and `src/pages/tags/[...rest].astro`, replace every `Astro.url.searchParams.getAll("tag")` with `readList(Astro.url, "tag")`, importing `readList` from `../lib/query` and `../../lib/query`.

Confirm nothing reads the old form:

```bash
grep -rn 'getAll("tag")' src/
```

Expected: no output.

- [x] **Step 6: Run the full suite**

Run: `npm test`
Expected: PASS.

- [x] **Step 7: Commit**

```bash
git add src/lib/query.ts test/query.test.ts src/components/Toolbar.astro src/pages/
git commit -m "feat: carry tags in one comma-separated parameter"
```

---

## Task 2: `/N` pagination at the root

Master publishes `/2`, `/3` and `/4`. Nothing in v2 serves them, and `couldBeRedirect` rejects `/2` before any lookup, so each is a 404 today. This task makes them the real address rather than a redirect, which is what the corrections in `2026-08-11-foundation-gallery.md` asked for.

One rest route replaces `index.astro` so the gallery body exists once.

**Files:**
- Create: `src/lib/pagination.ts`, `src/pages/[...page].astro`
- Delete: `src/pages/index.astro`
- Modify: `src/components/Pagination.astro`
- Test: `test/pagination.test.ts`

**Interfaces:**
- Consumes: `listStates` and `listFacets` from `src/db/`, unchanged.
- Produces: `parsePageSegment(segment: string | undefined): number | null` — the page number, or `null` when the segment is anything other than an integer of 2 or more. `pageHref(base: string, page: number, search: string): string` — the address of one pager link.

- [x] **Step 1: Write the failing test**

```ts
import { it, expect } from "vitest";
import { pageHref, parsePageSegment } from "../src/lib/pagination";

it("reads a page number from the segment", () => {
  expect(parsePageSegment("2")).toBe(2);
  expect(parsePageSegment("47")).toBe(47);
});

// `/` is page 1. `/1` would be a second address for it, so the route rejects
// the segment and Task 2 step 5 redirects it.
it("rejects the segment that would duplicate page one", () => {
  expect(parsePageSegment("1")).toBeNull();
});

it("treats an absent segment as page one", () => {
  expect(parsePageSegment(undefined)).toBe(1);
  expect(parsePageSegment("")).toBe(1);
});

// A root rest route matches everything a more specific route did not claim.
it("rejects anything that is not a bare integer", () => {
  for (const segment of ["abc", "2x", "-3", "2.5", "02", " 2", "2/3", "١٢"]) {
    expect(parsePageSegment(segment), segment).toBeNull();
  }
});

it("builds page one as the bare base", () => {
  expect(pageHref("/", 1, "")).toBe("/");
  expect(pageHref("/tags/mobile", 1, "")).toBe("/tags/mobile");
});

it("builds later pages as a path segment", () => {
  expect(pageHref("/", 3, "")).toBe("/3");
  expect(pageHref("/tags/mobile", 3, "")).toBe("/tags/mobile/3");
});

it("carries the filters through as a query string", () => {
  expect(pageHref("/", 3, "device=phone")).toBe("/3?device=phone");
  expect(pageHref("/", 1, "device=phone")).toBe("/?device=phone");
});
```

- [x] **Step 2: Run to confirm failure**

Run: `npm test -- pagination`
Expected: FAIL — cannot resolve `../src/lib/pagination`.

- [x] **Step 3: Implement `src/lib/pagination.ts`**

```ts
/**
 * The page number, as a path segment.
 *
 * Master published `/2` and `/tags/mobile/2`, and both keep resolving here
 * rather than redirecting to a query parameter. Filters stay in the query
 * string, so one address is a path for the page and a query for the facets.
 *
 * Pure, so the root rest route's guard is testable without a request. That
 * guard is load-bearing: `[...page]` matches every path no other route
 * claimed, and a page that renders the gallery for `/wp-admin` would answer
 * a scanner with a 200.
 */

/** `\d+` alone, so `02`, `+2`, `2.0` and non-ASCII digits are all rejected. */
const BARE_INTEGER = /^\d+$/;

export function parsePageSegment(segment: string | undefined): number | null {
  if (!segment) return 1;
  if (!BARE_INTEGER.test(segment)) return null;

  const page = Number(segment);
  // Leading zeros survive the regex but name an address `/` already holds.
  if (String(page) !== segment) return null;
  // `/1` and `/0` are addresses for a page reachable at the base path.
  return page >= 2 ? page : null;
}

export function pageHref(base: string, page: number, search: string): string {
  const path = page <= 1 ? base : `${base === "/" ? "" : base}/${page}`;
  const at = path || "/";
  return search ? `${at}?${search}` : at;
}
```

- [x] **Step 4: Run the tests**

Run: `npm test -- pagination`
Expected: PASS, 7 tests.

- [x] **Step 5: Write `src/pages/[...page].astro`**

Delete `src/pages/index.astro` and create this in its place. The frontmatter is `index.astro`'s with the page read from the path.

```astro
---
/**
 * The gallery, at `/` and at `/2` upward.
 *
 * A rest route rather than an `index.astro` beside a `[page].astro`, so the
 * body exists once. Astro prefers a static route and then a dynamic one, so
 * `/privacy` and `/s/<slug>` are claimed before this sees them.
 *
 * Everything this does not claim has to 404 here. A rest route at the root
 * matches `/wp-admin/setup-config.php` as readily as `/2`, and the middleware
 * only gets its turn on a 404.
 */
import Layout from "../layouts/Base.astro";
import Gallery from "../components/Gallery.astro";
import Pagination from "../components/Pagination.astro";
import Toolbar from "../components/Toolbar.astro";
import { getDb } from "../db/client";
import { listStates } from "../db/states";
import { listFacets } from "../db/taxonomies";
import { parsePageSegment } from "../lib/pagination";
import { readList } from "../lib/query";

const PER_PAGE = 60;

const segment = Astro.params.page;
// `/1` names the page `/` already serves. One 301 rather than two addresses.
if (segment === "1") return Astro.redirect("/", 301);

const page = parsePageSegment(segment);
if (page === null) return new Response("Not found", { status: 404 });

const url = Astro.url;
const device = url.searchParams.get("device") ?? undefined;
const os = url.searchParams.get("os") ?? undefined;
const tags = readList(url, "tag");

const db = getDb();
const [{ rows, total }, facets] = await Promise.all([
  listStates(db, { page, perPage: PER_PAGE, device, os, tags }),
  listFacets(db),
]);

const lastPage = Math.max(1, Math.ceil(total / PER_PAGE));
// A page past the end is a 404 rather than an empty gallery under a 200,
// which is what a crawler reads as a real page holding nothing.
if (page > lastPage) return new Response("Not found", { status: 404 });
---

<Layout title="EmptyStates">
  <Toolbar facets={facets} total={total} page={page} perPage={PER_PAGE} />
  <Gallery states={rows} />
  <Pagination page={page} lastPage={lastPage} />
</Layout>
```

- [x] **Step 6: Rewrite `src/components/Pagination.astro` to emit path hrefs**

Replace the `href` helper and the `withParams` import. The rest of the file is unchanged.

```astro
---
/**
 * Pages of 60. Rendered only when there is more than one.
 *
 * The page number is a path segment and the filters are a query string, so a
 * pager link keeps the current search verbatim and changes only the path.
 * `page` and `open` are dropped: the first no longer exists as a parameter,
 * and the second would reopen a popover on arrival.
 */
import { pageHref } from "../lib/pagination";

interface Props {
  page: number;
  lastPage: number;
}

const { page, lastPage } = Astro.props;
const url = Astro.url;

// The base is the path without its page segment, so `/3` and `/tags/mobile/3`
// both reduce to what page 1 is served at.
const base = url.pathname.replace(/\/\d+$/, "") || "/";

const search = new URLSearchParams(url.search);
search.delete("open");
search.delete("page");
const query = search.toString();

const href = (n: number) => pageHref(base, n, query);
const pages = Array.from({ length: lastPage }, (_, i) => i + 1);
---

{
  lastPage > 1 && (
    <nav class="pager" aria-label="Pagination">
      {page > 1 ? (
        <a href={href(page - 1)} rel="prev">
          Previous
        </a>
      ) : (
        <span>Previous</span>
      )}

      {pages.map((n) => (
        <a href={href(n)} aria-current={n === page ? "page" : undefined}>
          {n}
        </a>
      ))}

      {page < lastPage ? (
        <a href={href(page + 1)} rel="next">
          Next
        </a>
      ) : (
        <span>Next</span>
      )}
    </nav>
  )
}
```

- [x] **Step 7: Stop the toolbar resetting a parameter that no longer exists**

`toggleParam` in `src/lib/query.ts:44` deletes `page` from the query string, and `Toolbar.astro` passes `page: null` to `withParams` in six places. Neither is wrong, and both are now dead. Leave `toggleParam` alone — narrowing a filter still has to return to page 1, and the base path is where the toolbar's links already point.

Confirm no toolbar link carries a page segment:

```bash
grep -n "page" src/components/Toolbar.astro
```

Expected: matches on the `page` and `perPage` props and on the `page: null` arguments, and nothing building a path.

- [ ] **Step 8: Verify the route boundaries by hand**

Astro's route priority is not something a unit test in the Workers pool reaches, because the adapter writes `main` into `dist/` at build time.

```bash
npm run build && npx wrangler dev
```

Then check each of these, with `PUBLIC_MEDIA_BASE=/img` set in `.env`:

| Address | Expected |
|---|---|
| `/` | 200, page 1 |
| `/2` | 200, page 2, pager marks 2 as current |
| `/2/` | 301 to `/2` |
| `/2/?device=phone` | 301 to `/2?device=phone`, query preserved |
| `/4?device=phone` | 200, filtered page 4 |
| `/1` | 301 to `/` |
| `/99` | 404 |
| `/privacy` | 200 |
| `/s/<any slug>` | 200 |
| `/img/originals/<key>` | 200 |
| `/wp-admin/setup-config.php` | 404 |

- [x] **Step 9: Run the full suite**

Run: `npm test`
Expected: PASS, 164 tests.

- [x] **Step 10: Commit**

```bash
git add src/lib/pagination.ts test/pagination.test.ts src/pages/ \
        src/components/Pagination.astro
git rm --cached src/pages/index.astro 2>/dev/null || true
git commit -m "feat: serve gallery pagination at /N, the address master published"
```

---

## Task 3: Redirect every legacy tag path to its filter

Master publishes 40 tag paths, and `/tags/mobile/2` upward for the `mobile` tag. Each returns the same entries as a query-string filter on the gallery, so serving both would give one list two addresses.

`src/pages/tags/[tag].astro` cannot sit beside a `tags/[tag]/` directory, so one rest route replaces it. The route resolves the segment and redirects. It renders no gallery.

**Files:**
- Create: `src/pages/tags/[...rest].astro`
- Delete: `src/pages/tags/[tag].astro`
- Test: `test/urls.test.ts`, `test/classify.test.ts`

**Interfaces:**
- Consumes: `resolveTagPath` from `src/lib/tags`, `parsePageSegment` from Task 2.
- Produces: nothing other tasks import.

- [x] **Step 1: Write `src/pages/tags/[...rest].astro`**

Delete `src/pages/tags/[tag].astro` and create this.

```astro
---
/**
 * Every legacy tag path, redirected to the filter it became.
 *
 * Gatsby published /tags/<x> for every raw value in the frontmatter `tags`
 * array, which mixed devices, operating systems and genuine tags.
 * `resolveTagPath` routes each to the column it now lives in.
 *
 * A redirect rather than a second gallery: `/tags/mobile` and `/?device=phone`
 * return the same 187 entries, and one list takes one address. A filter is a
 * query parameter everywhere on this site, so the path form names the query
 * form and stops there.
 *
 * A rest route because `[tag].astro` and a `[tag]/` directory cannot both
 * exist, and master publishes `/tags/mobile/2` as well as `/tags/mobile`.
 */
import { resolveTagPath } from "../../lib/tags";
import { parsePageSegment } from "../../lib/pagination";

const parts = (Astro.params.rest ?? "").split("/").filter(Boolean);
if (parts.length === 0 || parts.length > 2) {
  return new Response("Not found", { status: 404 });
}

const [tag, pageSegment] = parts;

// `parsePageSegment` rejects "1", since `/1` duplicates `/`. Master published
// no `/tags/<x>/1`, and a hand-typed one names page 1 and redirects there.
const page = pageSegment === "1" ? 1 : parsePageSegment(pageSegment);
if (page === null) return new Response("Not found", { status: 404 });

const route = resolveTagPath(tag);
// 404 rather than a redirect to an empty gallery. The middleware then gets its
// turn, in case this path is a retired one that moved.
if (!route) return new Response("Not found", { status: 404 });

// `route.kind` is "device", "os" or "tag", which are the three query keys.
const base = page > 1 ? `/${page}` : "/";
return Astro.redirect(`${base}?${route.kind}=${route.value}`, 301);
---
```

- [x] **Step 2: Add the redirect cases to `test/urls.test.ts`**

`resolveTagPath` already has coverage across all 40 legacy values. These check the address each one produces.

```ts
// Every filter is a query parameter, so a legacy path form names the query
// form. One list, one address.
it("redirects a legacy tag path to its filter", () => {
  const route = resolveTagPath("mobile");
  expect(route).toEqual({ kind: "device", value: "phone" });
  expect(`/?${route!.kind}=${route!.value}`).toBe("/?device=phone");
});

it("carries the page segment into the redirect target", () => {
  expect(parsePageSegment("3")).toBe(3);
  const route = resolveTagPath("mobile")!;
  expect(`/3?${route.kind}=${route.value}`).toBe("/3?device=phone");
});
```

Add `parsePageSegment` to the imports at the top of the file.

- [x] **Step 3: Assert that no tag names a facet, in the database**

A tag sharing a slug with a device or an operating system would give one filter two query keys. `?tag=phone` and `?device=phone` would return different sets under the same word. The local D1 has no such row today, and nothing asserts it.

Append to `test/urls.test.ts`:

```ts
// `classifyTag` tests three closed allowlists in order — OS, then DEVICE,
// then TAGS — so a facet term never reaches the tag map. This asserts the
// result, so an edit to that map cannot reintroduce the collision quietly.
it("keeps tag slugs disjoint from the facet slugs", async () => {
  const { results } = await env.DB.prepare(
    `SELECT slug FROM tags
      WHERE slug IN (SELECT slug FROM device_types)
         OR slug IN (SELECT slug FROM operating_systems)`,
  ).all<{ slug: string }>();
  const clash = results.map((r) => r.slug);
  expect(clash, `tags naming a facet: ${clash.join(", ")}`).toEqual([]);
});
```

- [x] **Step 4: Assert the same rule in the classifier**

The database test covers the migrated corpus. This one covers the function, so a new term added to `TAGS` fails before any import runs.

Append to `test/classify.test.ts`:

```ts
// The `TAGS` map is the only route to `kind: "tag"`. A facet term added to it
// would produce a tag slug colliding with a device or an operating system.
it("classifies every facet term as a facet", () => {
  const facets = [
    "mobile", "mobil", "phone", "tablet", "desktop", "tv", "console", "watch",
    "ios", "android", "web", "browser", "macos", "windows", "linux",
  ];
  const asTag = facets.filter((t) => classifyTag(t, "x").kind === "tag");
  expect(asTag, `classified as tags: ${asTag.join(", ")}`).toEqual([]);
});
```

- [x] **Step 5: Run the tests**

Run: `npm test -- urls classify`
Expected: PASS. The disjointness case returns an empty array against the current corpus, which has 25 tags, 3 devices and 5 operating systems in use.

- [x] **Step 6: Run the full suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 7: Verify by hand**

```bash
npm run build && npx wrangler dev
```

| Address | Expected |
|---|---|
| `/tags/mobile` | 301 to `/?device=phone` |
| `/tags/mobile/` | 301 to `/tags/mobile`, then 301 to `/?device=phone` |
| `/tags/mobile/2` | 301 to `/2?device=phone` |
| `/tags/mobile/1` | 301 to `/?device=phone` |
| `/tags/ios` | 301 to `/?os=ios` |
| `/tags/onboarding` | 301 to `/?tag=onboarding` |
| `/tags/not-a-tag` | 404 |
| `/tags/mobile/2/3` | 404 |
| `/tags/mobile/abc` | 404 |

- [x] **Step 8: Commit**

```bash
git add src/pages/tags/ test/urls.test.ts test/classify.test.ts
git commit -m "feat: redirect every legacy tag path to its filter"
```

---

## Task 4: The eight entries retired during triage

Eight addresses publish on master today and name nothing in v2. All eight are in `deletedDuringTriage` in `test/fixtures/legacy-urls.json`, and no test asserts anything about them:

```
/s/no-notes-in-bear-markdown-editor-for-macos/
/s/tumblr_mggzbrxUhV1rdf37to1_1280/
/s/tumblr_mh5iv6T19s1rdf37to1_1280/
/s/tumblr_mhpzfw7qkv1rdf37to1_1280/
/s/tumblr_moiu2y7o7N1rdf37to1_1280/
/s/tumblr_mp38ylJOSa1rdf37to1_1280/
/s/tumblr_mt8030S4ue1rdf37to1_1280/
/s/tumblr_n5hldmNcyT1rdf37to1_1280/
```

The other ten entries in that fixture list hold only a `.png` on master with no `index.md`, so Gatsby built no page for them and nothing is lost.

`state_redirects.state_id` is `NOT NULL REFERENCES states(id)`, so a row cannot point at the gallery. A static set in `redirects.ts` avoids both a schema change and a D1 read.

**The alternative, if you would rather keep the entries:** restore the eight `content/states/<dir>/index.md` files from master, re-run the migration, and skip this task. That is a content decision this plan does not make. A 301 to the gallery is the smaller change and the one written below.

**Files:**
- Modify: `src/db/redirects.ts`
- Test: `test/urls.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `resolveRedirect` returns `/` for a retired path. `couldBeRedirect` already claims every one of them, since all eight start `/s/`.

- [x] **Step 1: Write the failing test**

Append to `test/urls.test.ts`:

```ts
// Eight entries publish on master and were dropped during triage. Their
// addresses are in inbound links and bookmarks, so each answers with a 301 to
// the gallery rather than a 404.
it("sends a retired entry to the gallery", async () => {
  expect(await resolveRedirect(env.DB, "/s/tumblr_mp38ylJOSa1rdf37to1_1280")).toBe("/");
  expect(await resolveRedirect(env.DB, "/s/no-notes-in-bear-markdown-editor-for-macos")).toBe("/");
});

it("ignores a trailing slash on a retired entry, as Gatsby's URLs carried one", async () => {
  expect(await resolveRedirect(env.DB, "/s/tumblr_mp38ylJOSa1rdf37to1_1280/")).toBe("/");
});

// The set is checked before D1, so a retired path that later gains a real
// state would be shadowed. None of the eight is in the corpus.
it("prefers a live entry over the retired set", async () => {
  expect(await resolveRedirect(env.DB, "/s/tumblr_mggrayiCsC1rdf37to1_1280")).toBe(
    "/s/no-deals-yet",
  );
});
```

- [x] **Step 2: Run to confirm failure**

Run: `npm test -- urls`
Expected: FAIL — the first two receive `null`.

- [x] **Step 3: Add the set to `src/db/redirects.ts`**

Insert above `resolveRedirect`:

```ts
/**
 * Entries master publishes that this corpus dropped during triage.
 *
 * `state_redirects.state_id` is `NOT NULL REFERENCES states(id)`, so a row
 * cannot name a target that is not an entry. These eight have no successor,
 * so they answer with the gallery.
 *
 * A literal set rather than a table: eight strings that will not grow, read
 * without a D1 round trip on paths that are all scanner-adjacent anyway.
 *
 * Exported so `test/legacy-urls.test.ts` can hold it against the fixture, which
 * is the only thing keeping the two lists the same.
 */
export const RETIRED = new Set([
  "/s/no-notes-in-bear-markdown-editor-for-macos",
  "/s/tumblr_mggzbrxUhV1rdf37to1_1280",
  "/s/tumblr_mh5iv6T19s1rdf37to1_1280",
  "/s/tumblr_mhpzfw7qkv1rdf37to1_1280",
  "/s/tumblr_moiu2y7o7N1rdf37to1_1280",
  "/s/tumblr_mp38ylJOSa1rdf37to1_1280",
  "/s/tumblr_mt8030S4ue1rdf37to1_1280",
  "/s/tumblr_n5hldmNcyT1rdf37to1_1280",
]);
```

Then change the body of `resolveRedirect`, keeping the `candidates` block as it stands and adding the set check between it and the query:

```ts
  const candidates = [path];
  if (path.endsWith("/") && path.length > 1) candidates.push(path.slice(0, -1));
  else candidates.push(`${path}/`);

  const row = await db
    .prepare(
      `SELECT s.slug FROM state_redirects r
         JOIN states s ON s.id = r.state_id
        WHERE r.from_path IN (?, ?)
        LIMIT 1`,
    )
    .bind(candidates[0], candidates[1])
    .first<{ slug: string }>();

  if (row) return `/s/${row.slug}`;

  // After the table, so a path that gains a real successor wins over the set.
  return candidates.some((c) => RETIRED.has(c)) ? "/" : null;
```

- [x] **Step 4: Run the tests**

Run: `npm test -- urls`
Expected: PASS, all cases including the three added.

- [x] **Step 5: Run the full suite**

Run: `npm test`
Expected: PASS, 167 tests.

- [x] **Step 6: Commit**

```bash
git add src/db/redirects.ts test/urls.test.ts
git commit -m "feat: send the eight retired entries to the gallery"
```

---

## Task 5: A sweep over every address master publishes

Tasks 2 to 4 each fix one class. This task is the check that no class was missed, and the thing to re-run whenever the corpus changes.

The fixture holds 234 legacy directory names and 40 tag values. It holds no paginated addresses, which is why the `/2` gap survived Task 11 of the foundation plan.

**Files:**
- Modify: `test/fixtures/legacy-urls.json`
- Create: `test/legacy-urls.test.ts`

**Interfaces:**
- Consumes: `resolveRedirect`, `resolveTagPath`, `parsePageSegment`, and the `states` table.
- Produces: nothing.

- [x] **Step 1: Add the paginated addresses and split the triage list**

`deletedDuringTriage` holds 18 names covering two different cases. Eight have an `index.md` on master and so publish a page; ten hold only a `.png`, so Gatsby built nothing for them and their addresses never existed. A test over all 18 asserts a redirect for ten addresses nobody can have bookmarked.

Add three keys beside `states`, `deletedDuringTriage` and `tags`, leaving the existing keys untouched:

```json
  "retiredWithPages": [
    "no-notes-in-bear-markdown-editor-for-macos",
    "tumblr_mggzbrxUhV1rdf37to1_1280",
    "tumblr_mh5iv6T19s1rdf37to1_1280",
    "tumblr_mhpzfw7qkv1rdf37to1_1280",
    "tumblr_moiu2y7o7N1rdf37to1_1280",
    "tumblr_mp38ylJOSa1rdf37to1_1280",
    "tumblr_mt8030S4ue1rdf37to1_1280",
    "tumblr_n5hldmNcyT1rdf37to1_1280"
  ],
  "indexPages": ["/2", "/3", "/4"],
  "tagPages": ["/tags/mobile/2", "/tags/mobile/3", "/tags/mobile/4"],
```

Also add a line to the fixture's `note` recording what the split means:

```json
  "note": "Live URLs on emptystat.es before the rebuild, taken from master's content/states. `states` and `retiredWithPages` together are every address Gatsby publishes. The remaining ten names in `deletedDuringTriage` hold only a .png on master, so no page was ever built for them.",
```

Master publishes 235 entries at 60 a page, giving four index pages, and its `mobile` tag holds 196, also four. No other tag reaches 61.

- [x] **Step 2: Write the failing test**

```ts
import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { it, expect, beforeAll } from "vitest";
import legacy from "./fixtures/legacy-urls.json";
import { RETIRED, resolveRedirect } from "../src/db/redirects";
import { resolveTagPath } from "../src/lib/tags";
import { parsePageSegment } from "../src/lib/pagination";

/**
 * Every address the live Gatsby site publishes, checked against the migrated
 * corpus. A name here that resolves nowhere is a link somebody has bookmarked
 * and a 404 after the cutover.
 */
beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});

/** The slugs this corpus serves, read once. */
async function liveSlugs(): Promise<Set<string>> {
  const { results } = await env.DB.prepare(
    "SELECT slug FROM states WHERE status = 'published'",
  ).all<{ slug: string }>();
  return new Set(results.map((r) => r.slug));
}

it("resolves every entry address, at its own slug or through a redirect", async () => {
  const slugs = await liveSlugs();
  const dead: string[] = [];

  for (const name of legacy.states) {
    if (slugs.has(name)) continue;
    if (await resolveRedirect(env.DB, `/s/${name}`)) continue;
    dead.push(`/s/${name}/`);
  }

  expect(dead, `no route and no redirect: ${dead.join(", ")}`).toEqual([]);
});

// Only the eight that publish a page on master. The other ten names in
// `deletedDuringTriage` hold a .png and no `index.md`, so Gatsby built nothing
// for them and their addresses never resolved.
it("resolves every entry retired during triage that had a page", async () => {
  const dead: string[] = [];
  for (const name of legacy.retiredWithPages) {
    if (await resolveRedirect(env.DB, `/s/${name}`)) continue;
    dead.push(`/s/${name}/`);
  }
  expect(dead, `retired and unrouted: ${dead.join(", ")}`).toEqual([]);
});

// The fixture and the set in `redirects.ts` name the same eight entries, and
// nothing keeps them together except this.
it("matches the retired set to the fixture", () => {
  expect([...RETIRED].sort()).toEqual(
    legacy.retiredWithPages.map((n) => `/s/${n}`).sort(),
  );
});

it("routes every tag page", () => {
  const dead = legacy.tags.filter((t) => resolveTagPath(t) === null);
  expect(dead, `unroutable tags: ${dead.join(", ")}`).toEqual([]);
});

// The gap this fixture missed until now: `/2` is a path, and `couldBeRedirect`
// rejects it, so nothing in the redirect layer would ever have claimed it.
it("parses every paginated address master publishes", () => {
  const dead = [...legacy.indexPages, ...legacy.tagPages].filter((path) => {
    const segment = path.split("/").pop();
    return parsePageSegment(segment) === null;
  });
  expect(dead, `unparseable page segments: ${dead.join(", ")}`).toEqual([]);
});

// Master's tag URLs all end in a slash and Astro's `trailingSlash` is
// 'ignore', so both forms reach the route and the canonical picks one.
it("parses a paginated address carrying its trailing slash", () => {
  const segment = "/tags/mobile/2/".split("/").filter(Boolean).pop();
  expect(parsePageSegment(segment)).toBe(2);
});
```

- [x] **Step 3: Run to confirm it fails before the fixture keys exist**

Run: `npm test -- legacy-urls`

If Tasks 2 to 4 are already committed, the first four cases pass and this step confirms the fixture keys were added. Run it with the fixture edit reverted to see the failure the test is for: `Cannot read properties of undefined (reading 'filter')`.

- [x] **Step 4: Run the tests**

Run: `npm test -- legacy-urls`
Expected: PASS, 6 tests. `dead` is empty in every case.

- [x] **Step 5: Run the full suite**

Run: `npm test`
Expected: PASS, 173 tests.

- [ ] **Step 6: Sweep the live site against the deployed one**

After Task 12 of `2026-08-11-foundation-gallery.md` deploys, run every address through the deployed host. Read the first hop of each, so a redirect target is checked and a chain is visible:

```bash
for u in / /2 /3 /4 /privacy \
         /tags/mobile /tags/mobile/2 /tags/mobile/3 /tags/mobile/4 \
         /tags/ios /tags/onboarding /tags/mobile/; do
  printf '%s -> %s\n' "$u" "$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "https://emptystat.es$u")"
done
```

Expected first hops:

| Address | First hop |
|---|---|
| `/`, `/2`, `/3`, `/4`, `/privacy` | 200 |
| `/tags/mobile` | 301 to `/?device=phone` |
| `/tags/mobile/2` | 301 to `/2?device=phone` |
| `/tags/mobile/` | 301 to `/tags/mobile` |
| `/tags/ios` | 301 to `/?os=ios` |
| `/tags/onboarding` | 301 to `/?tag=onboarding` |

Then the same over every entry, reading the names from the fixture:

```bash
node -e '
const l = require("./test/fixtures/legacy-urls.json");
console.log([...l.states, ...l.deletedDuringTriage].map(s => "/s/" + s + "/").join("\n"));
' | while read -r u; do
  code=$(curl -s -o /dev/null -w '%{http_code}' -L "https://emptystat.es$u")
  [ "$code" = "200" ] || echo "$u -> $code"
done
```

Expected: no output from the second loop.

- [x] **Step 7: Commit**

```bash
git add test/fixtures/legacy-urls.json test/legacy-urls.test.ts src/db/redirects.ts
git commit -m "test: assert every legacy address resolves after the cutover"
```

---

## Three decisions, taken

Google's ecommerce URL page raised two questions about the filter design, and reviewing the tag routes raised a third. All three are answered, in Tasks 1, 1A and 3.

### Tags ride in one parameter

Google's page states: "Avoid using the same parameters twice. Googlebot may ignore one of the values otherwise." The toolbar wrote `?tag=error&tag=onboarding` and read it back with `getAll`.

**Taken:** one comma-separated value, `?tag=error,onboarding`. Task 1A changes `toggleParam`, the two gallery routes and `Toolbar.astro`.

### Device and operating system are indexed, tags are not

`canonicalPath` self-canonicalises the bare gallery, one `device`, or one `os`. Everything else points at the gallery path it filters.

The corpus decides this. Three devices carry 187, 45 and 3 entries. Five operating systems carry 33, 32, 24, 8 and 1. Of the 25 tags, 20 carry a single entry, four carry four, and one carries two, so a tag view repeats a detail page.

That gives 8 indexable facet views plus the 4 gallery pages, against several thousand addresses under the previous rule.

**The duplicate this removes.** `/tags/mobile` and `/?device=phone` return the same 187 entries. Task 3 redirects the path form to the query form with a 301, so one list has one address and `canonicalPath` never sees the collision.

### No tag names a facet

A tag sharing a slug with a device or an operating system would give one word two query keys. `?tag=phone` and `?device=phone` would return different sets.

The local D1 has no such row: `tags` holds 25 slugs and none appears in `device_types` or `operating_systems`. `classifyTag` prevents it by testing three closed allowlists in order, `OS`, `DEVICE`, then `TAGS`, so a facet term never reaches the tag map.

Nothing asserted either fact. Task 3 adds one test over the database and one over the classifier.

The ingest path in spec 02 and the submissions form in spec 03 write tags without calling `classifyTag`, so a submitter typing "mobile" would create the row these tests forbid. SQLite rejects a subquery inside a `CHECK`, so that guard is a trigger in a migration or a check in the ingest code. Out of scope here, and tracked against `v2.1`.

## Out of scope

- **The sitemap.** Search engines learn the new addresses from a 301 and from `rel=canonical`, both of which this plan supplies. A `sitemap.xml` tells them faster, and master publishes one that v2 does not. Separate task, separate issue.
- **The service worker.** Master registers one through `gatsby-plugin-offline`, and a returning visitor's browser will keep serving master's cached HTML from its own address after the cutover. That is a caching problem rather than a routing one, and no redirect reaches it.
- **`robots.txt`.** Master publishes one; v2 does not. Nothing in this plan depends on it.
- **The submissions guard.** `classifyTag` runs in the migration alone. Spec 02's ingest path and spec 03's submissions form write tags without it, so neither is stopped from inserting a facet-named tag. Separate issue, `v2.1`.
- **Open Graph cards.** `2026-08-19-pre-launch.md` owns them, and a card is keyed by state id rather than by address.

## Corrections found while executing, 2026-08-21

1. **Task 5's sweep could not run in the Workers pool.** `applyD1Migrations`
   starts from empty tables, and checking 235 entry addresses needs the rows
   the migration wrote. The corpus half moved to
   `scripts/check-legacy-urls.ts`, run as `npm run check:urls`. Its first run
   reported 242 addresses, 54 at the same address, 188 through a 301, 0 dead,
   and 0 unroutable tag paths. `test/legacy-urls.test.ts` keeps the four cases
   a pure function can decide.

2. **`withParams` re-encoded the comma.** `URLSearchParams.toString` writes
   `%2C`, so a toolbar link spelled one address differently from
   `canonicalPath`. Both now share one `serialise` helper in
   `src/lib/query.ts`, and `test/query.test.ts` asserts the literal form.

3. **The toolbar's facet links kept the page segment.** Choosing a filter on
   `/3` produced `/3?device=phone`, which is a 404 when the narrower result
   set has fewer than three pages. `basePath` moved into
   `src/lib/pagination.ts`, and `Toolbar.astro` builds every facet link and
   the Clear link from it. The dead `page: null` arguments are gone.

## Self-Review

**Coverage against the master-to-v2 comparison.** Four URL classes were found missing: `/2`–`/4` (Task 2), `/tags/mobile/2`–`/4` (Task 3), the eight triage-retired entries (Task 4), and the absent canonical on filtered views (Task 1). Task 5 is the sweep that would have caught all four.

**Gap found and closed.** `Pagination.astro` computes its base by stripping a trailing `/\d+`. On `/tags/mobile/3` that yields `/tags/mobile`, which is correct, and Task 3 step 2 checks it rather than assuming it. Without that check the tag pager would have linked to `/3`.

**Gap found and closed.** A root rest route matches every path no other route claimed, including the `/wp-admin` probes that issue #28 was raised about. `parsePageSegment` returns `null` for anything other than a bare integer, and the route answers 404, which hands the request to the middleware exactly as before. Task 2 step 1 tests eight rejected forms, including a leading zero and a non-ASCII digit.

**Gap found and closed.** `/1` and `/tags/mobile/1` would each be a second address for a page already served at the base path. Both redirect with a 301 rather than rendering.

**Gap found and closed.** A page past the last one returned an empty gallery under a 200, which reads to a crawler as a real page holding nothing. Both routes 404 past `lastPage`.

**Gap found and closed.** Astro's default `trailingSlash: 'ignore'` left `/2` and `/2/` both answering 200, so every address on the site had a twin that only the canonical separated. `'never'` reduces each pair to one 200 and one 301. Master publishes the slashed form throughout, so this covers all 235 entry addresses and all 43 gallery addresses at once.

**Open question recorded rather than closed.** Whether Astro's slash redirect runs ahead of `src/middleware.ts` decides if a renamed entry arriving as `/s/<old>/` takes one hop or two. Task 1 step 8 measures it against a build, since the development server prints a warning page instead of redirecting.

**Gap found and closed.** `/tags/mobile` and `/?device=phone` return the same 187 entries, and `canonicalPath` alone would make both self-canonical. Task 3 redirects the path form, so one list has one address.

**Gap found and closed.** No test asserted that `tags` shares no slug with `device_types` or `operating_systems`. Adding `mobile: "mobile"` to the `TAGS` map in `src/migrate/classify.ts` would have passed all 149 tests and produced two query keys for one word. Task 3 steps 3 and 4 assert the rule over the database and over the classifier.

**Verified rather than assumed.** Astro applies the slash redirect before the middleware, confirmed at `node_modules/astro/dist/core/routing/handler.js:38`. A renamed entry arriving in master's slashed form takes two 301s. Task 1 step 8 records the chain and the command that shows it.

**Type consistency.** `parsePageSegment` and `pageHref` are defined in Task 2 and consumed in Tasks 3 and 5 under those names. `canonicalPath` is defined in Task 1 and consumed only by `Base.astro`. `resolveRedirect` keeps its `Promise<string | null>` signature through Task 4; the change is which strings it can return. `readList` is defined in Task 1A and consumed by `Toolbar.astro` and both gallery routes. `canonicalPath` reads the comma form Task 1A writes, so Task 1A ships before or with Task 1.

**No placeholders.** Every step names its file and shows the code or the command. The two hand-verification steps list every address and its expected status, since Astro's route priority is decided at build time and no Workers-pool test reaches it.
