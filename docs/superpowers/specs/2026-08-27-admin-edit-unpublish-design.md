# Admin edit and unpublish

**Date:** 2026-08-27
**Parent:** `2026-08-23-admin-capture-design.md`
**Issue:** #51

## Scope

Three additions to the admin: an Edit link on a published state's detail
page, an edit screen for an existing state, and an Unpublish action that
removes the state from the public site while keeping its row and images.
A draft index at `/admin` lists unpublished states as thumbnails, so an
unpublished state has a way back.

**Out of scope, with the trigger to add each:**

- Hard delete of a state's D1 rows and R2 objects — when storage matters
- Replacing a state's image — a new image is a new state via `/admin/new`
- Changing a state's slug — public URLs stay where they are
- An admin preview of an unpublished state at `/s/<slug>` — when a review
  step needs it (#35)

---

## 1. Admin detection on public pages

Access sets the `CF_Authorization` cookie for the whole `emptystat.es`
domain after login, and the cookie holds the same JWT the `/admin` gate
verifies from the `Cf-Access-Jwt-Assertion` header. The middleware reads
the header first and the cookie second, verifies whichever is present,
and records the result as `Astro.locals.admin`.

A request without either costs no verification. Under `astro dev`,
`admin` is true on every request, matching the existing gate bypass.

The `/admin` and `/api/admin` gate is unchanged in effect: a request there
without a verified token still receives a 401.

---

## 2. The Edit link

The detail page `/s/<slug>` renders an Edit link in its top bar when
`Astro.locals.admin` is true. The link points at `/admin/edit/<id>`.

Gallery cards stay as they are. Each card is one anchor, and a second
control inside it would break the link.

---

## 3. Edit screen — `/admin/edit/<id>`

The same fields as `/admin/new`, pre-filled from the `states` row and its
tags, in the same two-column layout. The fields move into one component,
`StateFields.astro`, that both screens render. The image is the stored
variant, read-only.

Two buttons, both in the one form, distinguished by an `intent` field:

| State status | Buttons |
|---|---|
| `published` | Save, Unpublish |
| `draft` | Save, Publish |

A state with no route to its detail page — status `draft` — is reached
from the draft index only.

---

## 4. Update — `POST /api/admin/update`

Takes the state id, the form fields, and `intent` (`save`, `unpublish`,
or `publish`). In order:

1. Validate the fields under the same rules as publish: title, app name,
   device, OS, at least one tag, each against the active taxonomy rows.
   422 with the field names otherwise.
2. One D1 `batch()`: the `states` row (title, app name, app URL, device,
   OS, and `status` when the intent changes it), the `state_tags` rows
   (delete then insert), and the `states_fts` row.
3. Redirect: `save` returns to the edit screen with a Saved toast.
   `unpublish` and `publish` go to `/admin` with a toast naming the slug.

`published_at` is never rewritten. A state unpublished and published
again returns to its original position in the gallery.

Every public query already filters on `status = 'published'`, so an
unpublished state leaves the gallery, its detail page, search, and the
previous/next links with the one column update. Nothing in R2 changes.

---

## 5. Draft index — `/admin`

A grid of thumbnails, one per state with `status = 'draft'`, newest
first, each linking to its edit screen. The page header shows the count
of pending submissions with a link to `/admin/new`. Toasts from the
update route render here.

The same grid is the shape the review queue (#35) needs for pending
submissions.

---

## 6. Configuration

No new bindings, secrets, or migrations. `states.status` already accepts
`draft`.

New files:

- `src/pages/admin/index.astro`
- `src/pages/admin/edit/[id].astro`
- `src/pages/api/admin/update.ts`
- `src/components/admin/StateFields.astro`
- `src/components/admin/Notice.astro`

Modified: `src/middleware.ts` and `src/lib/access.ts` (token from header
or cookie, `locals.admin`), `src/env.d.ts` (the `Locals` type),
`src/db/states.ts` (read by id, list drafts), `src/lib/admin.ts` (shared
validation, `handleUpdate`), `src/pages/admin/new.astro` (uses the shared
components), `src/pages/s/[slug].astro` (the Edit link).

---

## 7. Verification

- [ ] `/s/<slug>` shows Edit only when the request carries a verified
      Access token
- [ ] `/admin/edit/<id>` renders the state's values and tags pre-filled
- [ ] Save rewrites title, app name, URL, device, OS, tags, and search
- [ ] Unpublish removes the state from the gallery, detail page, search,
      and previous/next, and the row and R2 objects remain
- [ ] `/admin` lists the unpublished state, and Publish from its edit
      screen restores it at its original position
- [ ] Update cannot complete without title, app name, device, OS, and one
      tag
- [ ] `/admin` and `/admin/edit/<id>` return 401 without a token
