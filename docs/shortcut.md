# Capturing a state from a phone

An iOS Shortcut uploads a screenshot from the share sheet straight to
`emptystat.es`, behind Cloudflare Access. This document covers the Access
setup, the two Worker secrets, the Shortcut recipe, and the home screen
install.

Three values are needed before anything works, and each comes from a
different place in the Cloudflare dashboard:

| Value | Where it comes from | Used by |
|---|---|---|
| Team domain | Zero Trust > Settings > Custom Pages, "Team domain" | The `ACCESS_TEAM_DOMAIN` secret |
| Application audience tag | An Access application's Overview tab | The `ACCESS_AUD` secret, one per Worker |
| Service token | Zero Trust > Access > Service Auth | The Shortcut's two `CF-Access-*` headers |

The team domain and the audience tag are identifiers the Worker uses to
verify a token. The service token is the credential the Shortcut presents.

## Access applications

An Access application is the thing that issues tokens for a hostname. The
Worker verifies each token's `aud` claim against the application it expects,
so each Worker needs its own application and its own audience tag.

### Production: `emptystat.es`

1. Open Zero Trust > Access > Applications. If an application already covers
   `emptystat.es/admin`, open it and skip to step 4.
2. Add a self-hosted application with two public hostnames: `emptystat.es`
   with path `admin`, and `emptystat.es` with path `api/admin`. Set the
   session duration to 30 days.
3. Add two policies: an Allow policy whose include rule is the owner's email,
   and a Service Auth policy whose include rule is the service token from
   "Service token" below. If the token does not exist yet, create it first,
   then add this policy.
4. On the application's Overview tab, copy "Application Audience (AUD) Tag".
   It is a 64-character hex string. This is the production `ACCESS_AUD`.

### Staging: the workers.dev address

1. Open Workers & Pages, select the `emptystates-v2` Worker, and open
   Settings > Domains & Routes.
2. On the workers.dev row, enable Access. Cloudflare creates an Access
   application for that hostname automatically. If the toggle is already
   on, the application already exists.
3. Open Zero Trust > Access > Applications and find the application named
   after the Worker. Copy its audience tag from the Overview tab. This is the
   staging `ACCESS_AUD`, and it differs from the production one.
4. Confirm the application's policy allows the owner's email and add a
   Service Auth policy for the service token, so the Shortcut can be tested
   against staging.

## Team domain

Open Zero Trust > Settings > Custom Pages. The team domain is shown as
`<team>.cloudflareaccess.com`. The same value appears in the address bar of
any Access login page. One value covers both Workers, because both belong to
the same Zero Trust account.

## Service token

A service token is a client ID and a client secret. Access issues a token to a
request that carries both as headers, and the Worker sees that token exactly
as it sees one from a browser session.

1. Open Zero Trust > Access > Service Auth > Service Tokens.
2. If a token for the Shortcut already exists **and its secret was recorded**,
   reuse it. The secret is shown once, at creation, and cannot be retrieved
   later. If the secret was not recorded, create a new token and delete the
   old one, so that no unused credential stays valid.
3. Otherwise create a token. Name it after its use, for example
   `emptystates-shortcut`. Copy the client ID and the client secret before
   closing the dialog.
4. Where a token was replaced, update the Service Auth policy on each Access
   application to name the new token, and update the two headers in the
   Shortcut.

## Worker secrets

The Worker reads two secrets: `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD`. Until
both are set on a Worker, every request to `/admin` on that Worker gets a
401. The gate fails closed.

`wrangler secret put` writes or overwrites one secret. A secret that already
exists needs no delete first. Running the command again replaces the value.
`wrangler secret list` shows the names present on a Worker and never the
values.

Run the commands from the repository root. After any build, add
`--config wrangler.jsonc`; the build leaves `.wrangler/deploy/config.json`
pointing wrangler at the generated configuration, which is the wrong one for
secret and D1 commands.

Staging, the default target:

```bash
npx wrangler secret put ACCESS_TEAM_DOMAIN --config wrangler.jsonc
npx wrangler secret put ACCESS_AUD --config wrangler.jsonc
npx wrangler secret list --config wrangler.jsonc
```

Production:

```bash
npx wrangler secret put ACCESS_TEAM_DOMAIN --name emptystates --config wrangler.jsonc
npx wrangler secret put ACCESS_AUD --name emptystates --config wrangler.jsonc
```

Each command prompts for the value. Paste the team domain or the audience
tag for the Worker named in the command.

### The "latest version isn't currently deployed" error

`wrangler secret put` creates a new Worker version containing the secret and
deploys it. Before uploading, the API checks that the Worker's most recently
uploaded version is the one serving traffic. When a newer version exists
undeployed, the command fails with:

```
Secret edit failed. You attempted to modify a secret, but the latest
version of your Worker isn't currently deployed.
```

Two situations produce it:

- Two `secret put` commands run within seconds of each other, before the
  first deployment has registered. Run the second command again.
- A version was uploaded without being deployed. On production this is the
  expected state between a `v2.*` tag's upload and its approval through the
  `production` environment, and also the state left by a rollback. On
  production, do not resolve it with `wrangler versions secret put` or with
  the dashboard: both build the new version on top of the undeployed one,
  and deploying that version publishes whatever code it contains. Set the
  production secrets after the next tagged deploy, when the latest version
  and the deployed version match again.

To see which situation applies, compare the newest ID from
`npx wrangler versions list --name <worker> --config wrangler.jsonc` with the
one at 100% in `npx wrangler deployments list --name <worker> --config
wrangler.jsonc`.

## The Shortcut

Build the following in the Shortcuts app.

1. Create a new shortcut and add the "Receive Images and Screenshots from
   Share Sheet" action, so the shortcut appears in the share sheet for images.
2. Add "Get Contents of URL", set to `https://emptystat.es/api/admin/upload`,
   method POST. Set the request body to Form, with one field named `file`,
   type File, value Shortcut Input. Add three headers:
   - `CF-Access-Client-Id`, set to the service token's client ID
   - `CF-Access-Client-Secret`, set to the service token's client secret
   - `Origin`, set to `https://emptystat.es`

   The server rejects a form POST without a matching Origin header as a CSRF
   protection, and the Shortcuts app sends no Origin header on its own, so
   the third header must be set explicitly.
3. Add "Get Dictionary Value" for the key `url`, reading from the response of
   the previous action.
4. Add "Open URLs", set to `https://emptystat.es` followed by that value. The
   upload response returns a relative path, such as
   `/admin/new?draft=<id>`, so the Shortcut must prepend the origin itself
   before the URL will open.

To test against staging before the admin code is deployed to production, set
the URL in step 2 to the workers.dev address and set the Origin header to that
same address.

Screenshots arrive as PNG, which the upload endpoint accepts. If a HEIC photo
is ever rejected, insert a "Convert Image to PNG" action before the POST.

## Home screen

Open `/admin/new` in Safari, then use Share > Add to Home Screen. The page
links `/manifest.webmanifest`, so the home screen icon and name come from the
app manifest rather than the page title.
