# Admin capture

**Date:** 2026-08-23
**Parent:** `2026-08-11-04-admin-agent-design.md`
**Depends on:** 01 (built). 02 and 03 are not prerequisites.
**Phase:** 1

## Scope

The capture flow from spec 04, built ahead of the rest of the admin: Cloudflare
Access auth on `/admin/*`, a mobile-first capture screen at `/admin/new`, and
direct publish into `states`. Two entry points from a phone — the photo picker,
and an iOS Shortcut in the share sheet.

Drafts are rows in the existing `submissions` table with `source = 'admin'` and
`status = 'pending'`. The review queue (#35) reads the same table, so this flow
is its first panel rather than a parallel system.

**Out of scope, with the trigger to add each:**

- Vision suggestions — when #33 lands and ingest stores them
- Review queue panels, agent, Wanted — #35
- Turnstile and the public form — #34
- Deterministic rule checks (alpha, resolution) — the reviewer is the
  submitter; checks guard strangers

Decisions fixed in brainstorming: variants through the Images binding, both
entry points, batches handled one at a time, no vision call.

---

## 1. Auth

Cloudflare Access in front of `/admin/*` and `/api/admin/*`. One Allow policy
for the owner's email; one service token for the Shortcut.

The middleware verifies the `Cf-Access-Jwt-Assertion` JWT against the team's
public keys (`https://<team>.cloudflareaccess.com/cdn-cgi/access/certs`) and
returns 401 when the token is missing or invalid. Service-token requests carry
the same header with an `aud`-matched JWT, so one verification covers both
identities. Keys are fetched with `caches.default` so the JWKS call is not
per-request.

**Fail closed.** A hostname without an Access policy — staging on workers.dev
before the toggle is set, or a misconfigured route — serves 401, never the
admin. `import.meta.env.DEV` bypasses the check under `astro dev` only; a build
never carries the bypass.

Sessions last 30 days so the phone does not re-authenticate constantly.

### Shared data

`wrangler.jsonc` records that staging and production bind the same D1 and R2
under the assumption "the rebuild only reads". The admin writes, so a publish
from the staging worker changes live data. Single-user, accepted; the comment
in `wrangler.jsonc` is updated to say the admin writes and Access guards it.

---

## 2. Upload — `POST /api/admin/upload`

One multipart image per request. Both entry points call it.

1. Read the file from the form body.
2. `IMAGES.info()` gives format, width, height. Reject anything that is not
   PNG, JPEG, WebP or HEIC — the one trust-boundary check kept from spec 03,
   because the endpoint is reachable with a leaked service token.
3. Write the original, unmodified, to R2 at `submissions/<ulid>.<ext>`.
4. Insert the `submissions` row: `source = 'admin'`, `status = 'pending'`,
   width, height, aspect ratio, byte size, `created_at`.
5. Return `{ id, url: "/admin/new?draft=<id>" }`.

Bytes pass through the Worker. Spec 03's presigned-URL dance exists to keep
strangers' uploads off the Worker's request budget; one admin uploading
screenshots under 12 MB does not need it.

---

## 3. Capture screen — `/admin/new`

Mobile-first, per spec 04: the image gets the height, actions sit at the
bottom in thumb reach, publish is one tap with no confirmation.

**Without `?draft=`** — a full-width
`<input type="file" accept="image/*" multiple>`. On selection the page uploads
each file to `/api/admin/upload` and navigates to the first returned draft.
Remaining drafts wait as pending rows; no client-side queue state.

**With `?draft=<id>`** — the edit screen, top to bottom:

| Element | Behaviour |
|---|---|
| Image preview | The uploaded original, max available height |
| Device | Derived from aspect ratio against `device_types` ranges; shown as a confirmable line ("Phone ✓"), tap to override |
| OS | Six buttons from `operating_systems`; nothing pre-selected |
| App name | Text input + `<datalist>` of distinct `app_name` values |
| Title | Text input, placeholder in house style ("No results in Feedly") |
| Tags | Chips from existing `tags`, multi-select, minimum one |
| App URL | Optional |
| Publish | Bottom, full width |

Device derivation: the ratio ranges overlap deliberately, so the first active
`device_types` row (by `sort_order`) whose range contains the ratio wins. A
ratio outside every range pre-selects nothing and the line becomes a required
choice.

A pending-drafts count in the header ("3 more") shows batch progress. A web
app manifest makes `/admin/new` installable from the home screen; no service
worker, no offline support.

---

## 4. Publish — `POST /api/admin/publish`

Takes the draft id plus the form fields. In order:

1. Validate: title, app name, device, OS, at least one tag. 422 with the field
   names otherwise.
2. The state id **is the submission id** — already a ULID. A retried publish
   therefore writes the same R2 keys and slug instead of orphaning a failed
   attempt's objects.
3. Copy the R2 object to `originals/<stateId>.<ext>`; the states row's
   `r2_key` will point there.
4. Write WebP variants through the Images binding: `variantsFor(width)` at
   quality 82, each to `variantKey(w, stateId)` — the same keys
   `scripts/build-variants.ts` writes and the gallery reads. Never upscale.
5. One D1 `batch()`: the `states` row (slug from the existing helpers,
   `status = 'published'`, `published_at = now`, `is_legacy = 0`),
   `state_tags`, the `states_fts` row, and the submission update to
   `approved` with `reviewed_at` and `published_state_id`.
6. Delete the `submissions/` R2 object.
7. Redirect: the oldest remaining pending admin draft if one exists, else
   `/s/<slug>`.

D1 has no cross-request transactions with R2, so order matters: R2 writes
first, the D1 batch next, the source-object delete last. A failure before the
batch leaves the draft pending and some copied objects, which the retry
overwrites; a failure at step 6 leaves a stray `submissions/` object under a
published row. Neither failure shows a partial `states` row, because every D1
write is in the one batch.

`color_names` and the vision fields stay null, as they do for legacy rows;
ingest (#33) backfills them.

### No deploy, no commit

The site is `output: "server"`: every page reads D1 at request time, and
images are served from R2 directly. A publish is therefore live the moment
step 5's batch commits — no git commit, no build, no deploy. Git carries code
only.

---

## 5. Shortcut

An iOS Shortcut in the share sheet, documented in `docs/shortcut.md`:

1. Receive images (and screenshots) from the share sheet.
2. Get Contents of URL — POST the file as multipart to
   `https://emptystat.es/api/admin/upload`, headers `CF-Access-Client-Id` and
   `CF-Access-Client-Secret` from the service token.
3. Open the `url` from the JSON response in Safari, where the 30-day Access
   session already holds.

No code beyond the endpoint. PWA share targets are not used; iOS Safari does
not support them.

---

## 6. Configuration

`wrangler.jsonc` gains:

```jsonc
"images": { "binding": "IMAGES" }
```

A platform binding — no npm dependency, no lockfile change. Wrangler polyfills
it under `astro dev` with a low-fidelity local implementation; dimension
reads and WebP output both work locally.

New files:

- `src/pages/admin/new.astro`
- `src/pages/api/admin/upload.ts`
- `src/pages/api/admin/publish.ts`
- `src/lib/access.ts` — JWT verification
- `src/lib/device.ts` — device from ratio
- `src/db/submissions.ts`
- `public/manifest.webmanifest`
- `docs/shortcut.md`

Modified: `src/middleware.ts` (mount the auth check), `wrangler.jsonc`
(binding + comment).

Access needs two Worker secrets or vars: the team domain and the application
`aud` tag, for JWT verification.

---

## 7. Verification

- [ ] `/admin/new` and both API routes return 401 without a valid Access JWT
- [ ] A service-token request passes the same middleware
- [ ] Upload from the picker creates a pending `submissions` row and an R2
      object under `submissions/`
- [ ] Multi-select creates N drafts; publish steps to the next one
- [ ] Device is derived from the image with no dropdown interaction on a
      typical phone screenshot
- [ ] Publish is one tap; the published state renders in the gallery with
      variants at the keys the gallery reads
- [ ] Publish cannot complete without title, app name, device, OS and one tag
- [ ] A failed publish leaves the draft pending and re-publishing succeeds
- [ ] The Shortcut recipe works end to end with a service token
- [ ] Actions reachable one-handed on a 390 px viewport
