# 03 — Submissions

**Date:** 2026-08-11
**Parent:** `2026-08-10-emptystates-architecture.md`
**Depends on:** 01, 02
**Phase:** 1

## Scope

The public submission route: guidelines, form, bot defence, and the deterministic
rule checks. Ends when a submission is sitting in the queue with its checks
recorded. Reviewing it is 04.

**Nothing auto-publishes.** Every submission reaches a human in v1.

---

## 1. The rules

One principle, stated first because it answers questions the rules do not:

> **A submission is an opaque rectangle containing exactly what the app rendered —
> nothing added, nothing removed.**

| # | Rule | Enforced by |
|---|---|---|
| 1 | Full app screenshot, no cropping | Aspect ratio vs `device_types` range |
| 2 | Obfuscation allowed, dummy data preferred | Human |
| 3 | No macOS window shadow | **Alpha channel check** |
| 4 | Web: viewport only, no browser chrome | Vision + human |
| 5 | No device frames or mockups | Alpha + aspect + vision |
| 6 | No annotations, arrows or watermarks | Vision |
| 7 | Minimum resolution, no upscaling | Dimension check |
| 8 | One screen per submission | Aspect + vision |

Rule 3 generalises to **no alpha channel at all**. A macOS window capture carries
~60px of soft transparent shadow on every side; against a white card that shadow is
nearly invisible, so the app appears to float in an irregular margin and the
hairline traces the shadow's bounding box rather than the window's. Every shadowed
submission would break grid alignment in a way that looks like a CSS bug.

Transparency has no defined appearance against the card background, so the rule is
not "no shadows" but "no alpha".

`/guidelines` states these in plain language with a compliant and non-compliant
example for each, and explains *why* — people follow rules they understand and work
around rules they do not.

---

## 2. Deterministic checks

Run in the ingest consumer (02) immediately after `sharp` decode, before the vision
call. Results stored as `submissions.checks_json`.

```ts
type Check = { rule: string; pass: boolean; detail?: string }
```

| Check | Test | Failure |
|---|---|---|
| `alpha` | `hasAlpha === false` | **Hard** |
| `min_resolution` | short edge ≥ 750px | **Hard** |
| `max_bytes` | ≤ 12 MB | **Hard** |
| `format` | PNG, JPEG, WebP, HEIC | **Hard** |
| `aspect_in_range` | within declared device's min/max | Soft |
| `not_upscaled` | no sub-native detail at claimed resolution | Soft |
| `not_duplicate` | perceptual hash vs published corpus | Soft |

**Hard** failures set `status = 'auto_rejected'` with a reason, and never reach the
queue. **Soft** failures flag for review.

`alpha` is the single highest-value check in the system. Tested against an 18-image
sample from the real corpus it identified all four macOS window captures and
produced no false positives on any phone screenshot. One line of image metadata,
milliseconds, no model. Rules a machine can settle should never consume attention.

Duplicate detection uses a perceptual hash (dHash, 64-bit) stored per entry, matched
under a small Hamming distance. It catches the common case — the same screenshot
submitted twice, or one already in the corpus — and is deliberately soft, because a
different app's identically-structured empty state is a legitimate entry.

Minimum 750px on the short edge admits current phones (1170×2532 → 1170) while
excluding thumbnails. Note this **excludes some legacy entries** (872×938, 909×1920).
That is correct: `is_legacy` exempts them, and the floor governs what arrives next.

---

## 3. The form — `/submit`

| Field | Required | Notes |
|---|---|---|
| Image | ✅ | One file. Drag-drop, file picker, or camera on mobile |
| App name | ✅ | Autocompletes against existing `app_name` values |
| Title | ✅ | Placeholder shows the house style: "No results in Feedly" |
| Device type | ✅ | Active `device_types`, plus **Other** |
| Device type (other) | — | Free text, shown only when Other is selected |
| OS | ✅ | Active `operating_systems`, plus **Other** |
| Tags | ✅ | Minimum one, from existing tags |
| App URL | — | |
| Your name | — | Displayed as attribution if given |
| Your handle | — | Linked; accepts `@name` or a URL |

Everything except attribution is required, as decided. Deriving device and OS was
considered and rejected for the public form: a submitter who has to choose thinks
about the answer, and a wrong inference silently becomes wrong data. **The admin
capture flow in 04 does derive them**, because there the cost of a tap is paid
dozens of times by one person who can see the mistake.

### Unlisted device types

Selecting **Other** reveals a text field, stored as `device_type_other`. It never
writes to `device_types` — a public form that creates taxonomy rows produces a
taxonomy full of typos, synonyms and near-duplicates within a month.

Review (04) shows the proposed text with two actions: map to an existing type, or
create a new one. New types appear in the facet bar automatically. Same mechanism
for `os_other`.

### Upload

1. Client requests a one-time upload target from `POST /api/submit/init`, which
   returns a `submissionId` and a presigned R2 URL.
2. Client `PUT`s the file directly to R2 under `submissions/<id>.<ext>`. Bytes never
   pass through the Worker — no CPU, no request-size limit.
3. Client `POST`s the metadata plus the Turnstile token to `/api/submit`.
4. Worker verifies Turnstile, writes the `submissions` row as `queued`, enqueues an
   `IngestMessage`.
5. Returns immediately. Processing is asynchronous.

The confirmation page says the submission is queued for review, that there is no
notification because no email was collected, and roughly how long review takes. No
false promises about a follow-up that was deliberately not built.

---

## 4. Turnstile

Managed mode, sitekey in public config, secret in Worker secrets.

**Server-side `siteverify` is mandatory.** A widget without it renders a challenge
that protects nothing. Tokens expire after 300 seconds and are single-use; verify
once, on `/api/submit`, before anything is written.

Reject on failure with a plain message and no detail about why.

Turnstile guards `/api/submit` only. `/api/submit/init` is rate-limited by IP
instead — putting the challenge before the upload would mean re-solving after a slow
mobile upload, and a token can expire mid-transfer on a poor connection.

An orphan sweep deletes `submissions/` objects with no matching row older than 24
hours, since `init` can be called without ever completing.

---

## 5. Lifecycle

```
queued ──▶ [ingest] ──┬──▶ auto_rejected     hard check failed
                      └──▶ pending           in the review queue
pending ──▶ approved   published as a state row
        └──▶ rejected  kept with a reason
```

Approval (04) copies the submission into `states`, moves the R2 object from
`submissions/` to `originals/`, writes tags and colours, rewrites the FTS row, and
sets `published_state_id`.

Rejected and auto-rejected rows are **kept, not deleted**. They are the only record
of what the rules actually exclude, and the calibration set for the agent's eventual
auto-approve threshold. Purge the R2 object after 30 days; keep the row.

---

## 6. Verification

- [ ] A macOS window screenshot with shadow is auto-rejected on `alpha`
- [ ] A compliant phone screenshot passes every check
- [ ] Below-resolution image auto-rejected with a comprehensible reason
- [ ] Submitting the same image twice flags `not_duplicate` softly, not hard
- [ ] Form cannot submit without image, app name, title, device, OS and one tag
- [ ] Other + free text stores `device_type_other` and creates **no** taxonomy row
- [ ] Turnstile token replayed a second time is rejected
- [ ] `/api/submit` without a Turnstile token is rejected
- [ ] Upload bytes never traverse the Worker — confirm in network trace
- [ ] Orphaned `submissions/` objects are swept after 24 hours
- [ ] Rejected rows survive; their R2 objects do not, after 30 days
- [ ] `/guidelines` shows a compliant and non-compliant example per rule
