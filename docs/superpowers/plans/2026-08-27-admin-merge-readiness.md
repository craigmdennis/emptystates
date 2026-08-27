# Admin merge readiness

**Branch:** `upload-admin`, PR #49 into `v2`
**Specs:** `2026-08-23-admin-capture-design.md`,
`2026-08-27-admin-edit-unpublish-design.md`

What remains before the admin area is ready to merge, split by who can
do it. Tick each item as it lands.

## Without a decision

- [x] **Search rows keep their vision fields on save.** `handleUpdate`
      reads `description`, `screen_text`, and `color_names` from the row
      and passes them to `writeFtsRow`, so a Save no longer empties those
      columns in `states_fts`. Test: a row with a description keeps it
      after a save.
- [x] **The gate's 401 path has a test.** `vi.stubEnv("DEV", false)` in
      a middleware test, so a request to `/admin/new` without a token is
      answered 401 and one with a valid cookie is let through.
- [x] **Launch order is written down.** `docs/deploying.md` gains the
      order for the first production deploy: tag, deploy, set the two
      secrets, then `/admin` answers. Until the secrets exist the gate
      answers 401 and the header link stays hidden.
- [x] **The front door is documented.** `docs/shortcut.md` names `/admin`
      as the index and `/admin/new` as the capture screen. The manifest
      keeps `/admin/new` as its start URL: the home screen icon exists
      for capture from a phone, and the index is one link away.
- [x] **Upload leaves no orphan.** `handleUpload` deletes the R2 object
      when the `submissions` insert fails, and checks `file.size` before
      reading the bytes so a 20 MB overrun costs no buffering.
- [x] **PR #49 body describes the merged state.** Rewritten under the
      documentation register: the mechanisms, the change, what a reviewer
      checks, verification, files, and what is out of scope.
- [x] **Staging runs the branch head.** `npx wrangler deploy` from the
      branch, so the manual checks below run against current code.

## Needs a decision or a device

- [ ] **Cookie on production.** After the first production deploy with
      the secrets set, open any `/s/<slug>` while logged in to Access and
      confirm the Admin and Edit links render. The Access application
      covers only `/admin` and `/api/admin`, and the links depend on the
      `CF_Authorization` cookie reaching the public paths. If the links
      stay hidden, the fallback is a second Access application covering
      `emptystat.es/` with a Bypass policy for everyone, which makes
      Access set the cookie on every path without gating anything.
- [ ] **Staging loop on a phone and a desktop.** Edit from a detail page,
      Save, Unpublish, find the state on `/admin`, Publish, confirm it is
      back at its original position. Check the toast, the press feedback,
      and the two-column layout.
- [ ] **Shortcut end to end.** Needs a service token and a Service Auth
      policy on the staging Access application, then the recipe in
      `docs/shortcut.md` against the workers.dev address.
- [ ] **Classify #54 and #55.** Edit mode matching the live detail page,
      and the UI framework choice. Both are presentation. Before or after
      merge is the call to make.
- [ ] **Failed uploads by name.** The picker reports a count of failed
      files and no names. Carrying names through the redirect needs a
      choice about how much of the URL to spend on it.
