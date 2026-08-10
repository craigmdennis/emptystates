# Migrating the Gatsby site from Netlify to Cloudflare

**Date:** 2026-08-10
**Branch affected:** `master`
**Status:** approved, ready for implementation

## Problem

`emptystat.es` returns HTTP 522. The domain sits on Cloudflare nameservers
(`josh.ns.cloudflare.com`, `kiki.ns.cloudflare.com`) with proxied A records, but the origin
behind the proxy is unreachable. The Netlify deployment is still alive and healthy at
`emptystates.netlify.app`, serving the Gatsby build — it is simply no longer reachable
through the custom domain.

The `redesign` branch holds an Astro/EMDash rebuild on Workers, but it is not ready to
ship. The decision is to move the **existing Gatsby site** onto Cloudflare now, and ship
the redesign separately later.

## Goal

`emptystat.es` and `www.emptystat.es` serve the current Gatsby site from Cloudflare
Workers Static Assets. Netlify is retained as an unused rollback path.

## Non-goals

- Shipping the `redesign` branch.
- Deleting the Netlify site or its configuration.
- Upgrading Gatsby, React, or any dependency that currently works.
- Restoring push-to-deploy. Deploys are manual for the life of this arrangement.

## Constraints

**Node 14.** `.nvmrc` pins `v14.18.3`. Gatsby 4.5 with `sharp` and a 2022 lockfile is tied
to that era, and Node 14 reached end of life in April 2023. Cloudflare's build images do
not offer it. The build therefore runs locally, on nvm's `v14.18.3`, and only the built
output is uploaded.

**Cloudflare static asset limits**, confirmed against current docs:

| Limit | Free | Paid |
|---|---|---|
| Files per Worker version | 20,000 | 100,000 |
| Individual file size | 25 MiB | 25 MiB |
| `_headers` rules | 100 | 100 |
| `_redirects` static rules | 2,000 | 2,000 |

The file count needs measuring — 257 source images fanned out by sharp into multiple
widths and formats could plausibly approach 20,000. Raised limits require wrangler
≥ 4.34.0.

## Architecture

An **assets-only Worker** named `emptystates-site`. No Worker script, no `main`, no
`ASSETS` binding — Cloudflare serves `public/` directly from the edge.

The name deliberately differs from `emptystates`, which the `redesign` branch's
`wrangler.jsonc` already claims. Two Workers with the same name on one account are the
same Worker, and whichever deploys last wins.

### Two runtimes, one pipeline

The build and the deploy run on different Node versions, as separate steps:

- **Build:** Node 14.18.3 via nvm → `gatsby build` → `public/`
- **Deploy:** current Node → `npx wrangler@latest deploy`

Wrangler is **not** added to master's `package.json`. Modern wrangler will not install
cleanly against a Node 14 lockfile, and touching that lockfile is the fastest way to break
a build that currently works. `npx` fetches it into a temp prefix instead, leaving the
dependency tree untouched.

### Configuration

`wrangler.jsonc` on master:

```jsonc
{
  "name": "emptystates-site",
  "compatibility_date": "2026-08-10",
  "assets": {
    "directory": "./public",
    "html_handling": "auto-trailing-slash",
    "not_found_handling": "404-page"
  }
}
```

`auto-trailing-slash` is the wrangler default, set explicitly here because it is load-bearing:
Gatsby emits `public/s/<slug>/index.html`, and this is what makes `/s/<slug>` resolve and
canonicalise to `/s/<slug>/`, preserving every existing URL. `404-page` serves Gatsby's
built `404.html`.

## Redirects

`gatsby-node.js:59` calls `createRedirect()` for entries carrying a `redirect` frontmatter
field — 34 files have one, mostly Tumblr-era `/post/…` URLs. Gatsby's `createRedirect` is
inert without a plugin that writes them to disk, and neither `gatsby-plugin-netlify` nor any
equivalent is in `package.json` or `gatsby-config.js`. Netlify's auto-installed Essential
Gatsby build plugin has been doing this invisibly. Moving hosts silently drops all 34.

**Solution:** `scripts/generate-redirects.js`, a postbuild step that walks
`content/states/*/index.md`, reads frontmatter, and writes `public/_redirects`.

Not `gatsby-plugin-netlify`, despite it doing exactly this job. Adding any dependency to a
four-year-old lockfile on EOL Node is the highest-risk action available, and the plugin's
contribution here is a few dozen lines of file writing.

The generator must reproduce the guard at `gatsby-node.js:58` — `if (redirect && redirect !== null)`.
Several entries carry `redirect: ''`, which is falsy and skipped. Emitting a rule for those
produces a malformed `_redirects` line with an empty source path.

Cloudflare parses the same `_redirects` and `_headers` format Netlify originated, on both
Pages and Workers Static Assets, so the output format is unchanged from what Netlify has
been generating.

## Caching

`public/_headers`, written by the same script, encoding Gatsby's caching contract:

| Path | Cache-Control | Reason |
|---|---|---|
| `/page-data/*` | `no-cache` | not content-hashed |
| `/sw.js` | `no-cache` | not content-hashed |
| `/app-data.json` | `no-cache` | not content-hashed |
| `/static/*` | `max-age=31536000, immutable` | content-hashed |

Deliberately **no** blanket `*.js` / `*.css` immutable rule. Gatsby's hashed bundles sit at
the root, but so does `sw.js`, which must not be cached — and whether a later `_headers` rule
overrides an earlier match is not something worth making load-bearing. Cloudflare already
applies automatic etag-based caching to static assets, which is correct for hashed
filenames, so the blanket rule buys little and risks pinning a stale service worker.

This is the part that fails quietly if skipped. Gatsby hashes its JS and CSS filenames but
not the `page-data.json` files that client-side navigation fetches. Cache those and a
returning visitor receives a fresh HTML shell requesting page data the CDN still answers
from the previous build — navigation breaks with no error, and only for people who visited
before the deploy.

Well within the 100-rule `_headers` limit.

## Service worker

`gatsby-plugin-offline` is active and precaches `/mobile/` plus icons. Existing visitors
carry a Workbox service worker. It will update itself once it can reach a working origin,
but the first load after cutover may serve cached-old content. No action required; noted so
it is not mistaken for a failed deploy.

## Cleanup

Dead files removed from master:

- `static.json` — Heroku static buildpack config, unused
- `.ruby-version` — unused

Corrected:

- `README.md:1` — Netlify build badge
- `package.json:4` — the `description` field currently holds a Netlify build badge instead
  of a description

`netlify.toml` **stays**, so rollback remains a DNS change rather than a code change.

`gatsby-plugin-force-trailing-slashes` is in `devDependencies` but absent from
`gatsby-config.js`, so it does nothing. Left alone — removing it means touching the
lockfile.

## Execution sequence

1. Create a git worktree for `master`. The `redesign` worktree has its own `node_modules`,
   `data.db`, and untracked working state; switching branches in place would destroy the
   Astro dependency tree and force a full reinstall to get back.
2. `nvm use` → `npm ci` → `npm run build`. **This is the gate.**
3. Measure `public/`: file count against the asset limit, largest file against 25 MiB.
4. Add `wrangler.jsonc`, `scripts/generate-redirects.js`; regenerate `_redirects` and
   `_headers`.
5. `npx wrangler@latest login`, then `deploy`. Verify on `emptystates-site.<subdomain>.workers.dev`.
6. Verify: homepage, a state page, a tag page, pagination page 2, one `/post/…` redirect,
   404, `sitemap.xml`, `robots.txt`.
7. **Point of no return.** Attach `emptystat.es` and `www.emptystat.es` as Custom Domains,
   replacing the failing records. Confirm with Craig immediately before this step.
8. Add a Cloudflare Redirect Rule sending `www` to apex, matching
   `siteUrl: 'https://emptystat.es'` at `gatsby-config.js:6`.
9. Verify live, commit, push.

## Risks

**The dependency install is the primary risk, and it comes first.** A 2022 lockfile with
Gatsby 4, `sharp`, and `node-gyp` may not install on current macOS/arm64 — prebuilt binaries
for Node 14 on darwin-arm64 are the weak point. Fallbacks, in order: build inside a `node:14`
Docker container; or bump to Node 16/18 and patch what breaks. Deliberately not designed
around in advance, because step 2 answers it cheaply.

**File count** may exceed the limit. Measured at step 3. Mitigation is trimming the
generated breakpoint set in `gatsby-plugin-sharp` config.

**Branch topology.** `master` is currently a strict ancestor of `redesign`, so the eventual
redesign cutover would be a fast-forward. Committing hosting config to master ends that; the
later cutover will need a real merge. Inherent to lift-and-shift.

## Verification

The migration is done when `https://emptystat.es` returns 200 with the gallery, a
`/post/…` URL from the redirect set returns 301 to its `/s/…` destination, and
`https://www.emptystat.es` returns 301 to the apex.
