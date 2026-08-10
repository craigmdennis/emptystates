# emptystates

Delight users by designing the empty states

## Hosting

This branch is the Gatsby site, hosted on Cloudflare Workers Static Assets as
an assets-only Worker named `emptystates-site`.

Deploys are manual. Gatsby 4 is pinned to Node 14 (see `.nvmrc`), which reached
end of life in April 2023 and is not available on any hosted build image, so the
build runs locally and only the built output is uploaded.

### Deploying

The build and the deploy run on different Node versions:

```bash
nvm use          # Node 14.18.3, per .nvmrc
npm ci
npm run build    # gatsby build, then generates public/_redirects
```

Then, on a current Node:

```bash
npx wrangler@latest deploy
```

Wrangler is deliberately **not** a dependency. Installing it would mean
modifying a 2022 lockfile that currently builds, which is the fastest way to
break the one thing that still works.

### Redirects

`gatsby-node.js` calls `createRedirect()` for entries with a `redirect`
frontmatter field, but that call is inert without a plugin that writes the
redirects to disk. The previous host injected such a plugin at build time, which
is why no equivalent appears in `package.json` — and why the redirects would
have vanished silently when the site moved.

`scripts/generate-redirects.js` now writes `public/_redirects`, and runs as part
of `npm run build`. Its output is a plain text file of `from to 301` lines that
Cloudflare parses directly.

### Caching

`static/_headers` is copied verbatim into `public/` by Gatsby. It marks
`/page-data/*` and `/sw.js` as `no-cache` — Gatsby content-hashes its JS and CSS
filenames but not the page-data JSON that client-side navigation fetches, so
caching those breaks navigation for returning visitors after a deploy.

### Hostnames

`emptystat.es` and `www.emptystat.es` are both attached to the Worker as
Custom Domains (see `routes` in `wrangler.jsonc`).

`www` then 301s to the apex via a redirect rule created from Cloudflare's
www-to-root template. That rule lives in the Cloudflare dashboard, **not** in
this repo — if the redirect ever stops working, look there rather than here.
Redirect rules run before Workers in the request pipeline, which is why it
fires even though `www` is attached to the Worker.

### Rollback

Every deploy creates a new Worker version, and previous versions stay available.
To roll back without rebuilding:

```bash
npx wrangler@latest deployments list   # find the version to return to
npx wrangler@latest rollback [<version-id>]
```

This is faster and more reliable than rebuilding, which matters here because a
rebuild needs Node 14 and a full `npm ci`.
