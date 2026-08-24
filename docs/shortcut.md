# Capturing a state from a phone

An iOS Shortcut uploads a screenshot from the share sheet straight to
`emptystat.es`, behind Cloudflare Access. This document covers the Access
setup and the Shortcut recipe.

## Access setup

1. In Zero Trust, under Access > Applications, add a self-hosted application
   covering `emptystat.es/admin` and `emptystat.es/api/admin`. Set the session
   duration to 30 days. Add one Allow policy for the owner's email and one
   Service Auth policy for the service token created in step 3. Record the
   application's `aud` tag.
2. For staging, in the Workers dashboard, open the `emptystates-v2` Worker,
   go to Domains & Routes, and enable Access on the workers.dev subdomain.
   Record that application's `aud` tag as well; staging and production use
   different values.
3. Under Access > Service Auth, create a service token. Record its client ID
   and client secret.
4. Set two secrets per Worker: `ACCESS_TEAM_DOMAIN` (the team domain, in the
   form `<team>.cloudflareaccess.com`) and `ACCESS_AUD` (the `aud` tag from
   step 1 or step 2).

   ```bash
   npx wrangler secret put ACCESS_TEAM_DOMAIN   # staging: default config
   npx wrangler secret put ACCESS_AUD

   npx wrangler secret put ACCESS_TEAM_DOMAIN --name emptystates   # production
   npx wrangler secret put ACCESS_AUD --name emptystates
   ```

Until both secrets are set on a Worker, every request to `/admin` on that
Worker gets a 401. The gate fails closed.

## The Shortcut

Build the following in the Shortcuts app.

1. Create a new shortcut and add the "Receive Images and Screenshots from
   Share Sheet" action, so the shortcut appears in the share sheet for images.
2. Add "Get Contents of URL", set to `https://emptystat.es/api/admin/upload`,
   method POST. Set the request body to Form, with one field named `file`,
   type File, value Shortcut Input. Add two headers, `CF-Access-Client-Id`
   and `CF-Access-Client-Secret`, set to the client ID and secret of the
   service token created above.
3. Add "Get Dictionary Value" for the key `url`, reading from the response of
   the previous action.
4. Add "Open URLs", set to `https://emptystat.es` followed by that value. The
   upload response returns a relative path, such as
   `/admin/new?draft=<id>`, so the Shortcut must prepend the origin itself
   before the URL will open.

Screenshots arrive as PNG, which the upload endpoint accepts. If a HEIC photo
is ever rejected, insert a "Convert Image to PNG" action before the POST.

## Home screen

Open `/admin/new` in Safari, then use Share > Add to Home Screen. The page
links `/manifest.webmanifest`, so the home screen icon and name come from the
app manifest rather than the page title.
