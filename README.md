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
redirects to disk. Netlify's auto-installed Essential Gatsby plugin used to do
this, which is why no such plugin appears in `package.json`.

`scripts/generate-redirects.js` now writes `public/_redirects` instead, and runs
as part of `npm run build`. Cloudflare parses the same `_redirects` format
Netlify originated.

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

The Netlify site still serves its last successful deploy at
`emptystates.netlify.app`, so rolling back is a DNS change rather than a code
change: delete the Custom Domain records and point the zone back at Netlify.

`netlify.toml` has been removed, which does not affect that last deploy. It
does mean a fresh Netlify build would need its publish directory (`public`)
and the Gatsby cache plugin configured in the Netlify dashboard, since nothing
in the repo declares them any more.
