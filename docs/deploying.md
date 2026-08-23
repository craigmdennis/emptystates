# Deploying emptystat.es

Staging follows the branch. Production follows a tag and waits for an approval.
Neither runs from a laptop.

| | Worker | Trigger | Gate |
|---|---|---|---|
| Staging | `emptystates-v2` | push to `v2` | none |
| Production | `emptystates` | push of a `v2.*` tag | approval on the `production` environment |

## Staging

A push to `v2` runs `.github/workflows/staging.yml`: install, test, build,
publish. The result is at `https://emptystates-v2.craig-8d2.workers.dev`.

`npm run deploy` does the same thing from a terminal. It builds, checks that
the generated config still names `emptystates-v2`, and refuses `--env`. It
cannot name another Worker.

## Production

```bash
git tag v2.0.0
git push origin v2.0.0
```

That starts `.github/workflows/production.yml`, which uploads a version and
stops. The run summary carries the version id and a preview URL. Open the
preview, then approve the **promote** job in the Actions tab. Approval moves
traffic to that exact version and purges the zone cache.

Two properties fall out of the split. The bytes on the preview are the bytes
that take traffic, because promote rebuilds nothing. And a tag alone publishes
nothing, so tagging early is safe.

The purge is part of the promote rather than a step to remember. On 2026-08-23
a rollback reverted the Worker and the edge kept serving the version that had
just been rolled back, which made the site read as un-reverted for minutes.

## Rolling back

Find the version to return to:

```bash
gh workflow run rollback.yml -f version_id=<id> -f reason="<what broke>"
```

Version ids come from the run summary of the deploy that shipped them, or from
`wrangler versions list --name emptystates` on a machine with production
access.

`workflow_dispatch` appears only once the workflow file sits on the
repository's default branch, which is still `master`. Until `v2` merges, the
break-glass path is the Cloudflare dashboard: **Workers & Pages > emptystates >
Deployments > Promote**, then **Caching > Purge Everything** on the
emptystat.es zone. Both steps, in that order.

## Setup, once

Three GitHub environments already exist with their branch policies, and
`production` already requires an approval from `craigmdennis`. What remains
needs credentials, so it has to be done by hand.

### 1. Two Cloudflare API tokens

Create both at **My Profile > API Tokens > Create Token > Custom token**.

A staging token, and a production token with two permissions the staging one
does not need:

| Permission | Staging | Production |
|---|---|---|
| Account > Account Settings > Read | yes | yes |
| Account > Workers Scripts > Edit | yes | yes |
| Account > Workers KV Storage > Edit | yes | yes |
| Account > Workers R2 Storage > Edit | yes | yes |
| Account > D1 > Edit | yes | yes |
| User > User Details > Read | yes | yes |
| User > Memberships > Read | yes | yes |
| Zone > Workers Routes > Edit (emptystat.es) | no | yes |
| Zone > Cache Purge > Purge (emptystat.es) | no | yes |

Workers KV Storage is on the list because `dist/server/wrangler.json` declares
`kv_namespaces: [{ binding: "SESSION" }]` with no id. That is Astro's session
store, and wrangler provisions it at deploy time.

### 2. The secrets

Each command prompts for the value, so nothing reaches shell history.

```bash
R=craigmdennis/emptystates

gh secret set CLOUDFLARE_API_TOKEN  --repo $R --env staging             # staging token
gh secret set CLOUDFLARE_ACCOUNT_ID --repo $R --env staging

gh secret set CLOUDFLARE_API_TOKEN  --repo $R --env production-preview  # production token
gh secret set CLOUDFLARE_ACCOUNT_ID --repo $R --env production-preview

gh secret set CLOUDFLARE_API_TOKEN  --repo $R --env production          # production token
gh secret set CLOUDFLARE_ACCOUNT_ID --repo $R --env production
gh secret set CLOUDFLARE_ZONE_ID    --repo $R --env production
```

The account id and zone id are on the Cloudflare dashboard overview page for
the account and for the emptystat.es zone.

The token sits in the environment rather than at repository level, so a
workflow that names no environment has no Cloudflare credential at all.

### 3. Push the branch

`v2` is local only. Actions runs nothing until the branch reaches origin:

```bash
git push -u origin v2
```

## What this does not cover

Cloudflare API tokens have no per-Worker scope. **Workers Scripts > Edit** is
an account permission, so the staging token can write the live Worker too, and
so can any credential already on the machine. Separation here comes from where
each credential lives and who approves its use, rather than from what the
credential is able to do.

What that leaves: nothing in this repository points a local command at
production, and a `git push` cannot reach it. A hand-typed
`npx wrangler deploy --name emptystates` still can, for as long as the machine
holds an account-wide credential. Removing that last path means a second
Cloudflare account member holding a role without Workers write, which is a
Teams feature and more machinery than a single-maintainer site earns.

There is also no `tsc --noEmit` in CI. TypeScript is not a dependency of this
project, and `npx tsc` would resolve an unpinned compiler on every run. The
suite and the build are the gate.

## Notes

`wrangler d1` commands need `--config wrangler.jsonc` after any build.
`.wrangler/deploy/config.json` points wrangler at the generated config, where
D1 commands fail with API error 7403.

`wrangler deploy --env <unknown>` exits 0 and says nothing. The adapter drops
the `env` block from the generated config while keeping `definedEnvironments`,
so the flag validates against a list, applies nothing, and falls through to the
top-level `name`. That is the 2026-08-23 incident. `--name` behaves differently
and does override: wrangler resolves the target as `args.name ?? config.name`.

Cloudflare Workers Builds would give branch-to-environment mapping without a
hand-written workflow. It has no equivalent of a required reviewer, which is
the control this needed, so Actions won.
