# 04 — Admin and agent

**Date:** 2026-08-11
**Parent:** `2026-08-10-emptystates-architecture.md`
**Depends on:** 01, 02, 03
**Phase:** 1 (admin), 2 (auto-approval)

## Scope

A mobile-first admin optimised for two things you actually do: clearing a review
queue, and capturing screens from your phone. Plus the agent that triages the queue
before you see it.

**Design premise:** this is a single-user tool used mostly on a phone, often in
short bursts. Optimise for tap count and one-handed reach, not for screen density.

---

## 1. Auth

Cloudflare Access in front of `/admin/*` and `/api/admin/*`. One Allow policy for
your email. Google or one-time-PIN login.

No auth code in the application. The Worker reads `Cf-Access-Authenticated-User-Email`
and **verifies the `Cf-Access-Jwt-Assertion` JWT against the team's public keys** —
trusting the email header alone is only safe if the origin cannot be reached except
through Access, which is an assumption worth not making.

Sessions persist for 30 days so the phone does not re-authenticate constantly.

Confirm the Zero Trust free-tier seat allowance at setup. This needs one.

---

## 2. Review queue — `/admin/queue`

The primary screen. One submission at a time, full-bleed, not a list.

```
┌─────────────────────────────┐
│  ← 7 pending      ⚠ 2 flags │   status bar
├─────────────────────────────┤
│                             │
│      the screenshot         │   tap to zoom
│      (max available height) │
│                             │
├─────────────────────────────┤
│ Feedly · Android · Phone    │   derived + declared
│ no-results, illustration    │   tags, tap to edit
│ ⚠ detected iOS, declared    │   disagreements only
│    Android                  │
├─────────────────────────────┤
│   ✕ Reject      ✓ Publish   │   thumb-reach, bottom
└─────────────────────────────┘
```

Principles, each with a reason:

- **The image gets the height.** It is the thing being judged. Metadata is a strip.
- **Actions sit at the bottom**, within thumb reach one-handed. A publish button at
  the top of a phone screen is a two-handed action performed hundreds of times.
- **Only disagreements are surfaced.** When the agent, the checks and the submitter
  agree, show nothing. Attention is the scarce resource; a screen that reports
  everything reports nothing.
- **Publish is one tap.** No confirmation dialog. An accidental publish is
  recoverable by unpublishing; a confirmation on every item is a tax on the common
  case to protect against the rare one.
- **Reject requires a reason**, chosen from the rule list plus "other". This is what
  makes rejections a calibration set rather than a void.
- **Swipe left/right** as an alternative to the buttons; keyboard `J`/`K`/`P`/`X` on
  desktop.

Editing before publishing: tapping any metadata field opens an inline editor.
Agent-suggested tags appear as chips that are accepted with one tap and are never
applied automatically.

### Other panels

- **Flagged** — soft-check failures and agent/submitter disagreements.
- **Auto-rejected** — what the machine turned away, reviewable. Check this weekly at
  first; it is the only way to catch a check that is too aggressive.
- **New device types** — pending `device_type_other` / `os_other` proposals, with
  map-to-existing or create-new.
- **DLQ** — messages that failed ingest three times.
- **Wanted** — see section 4.
- **Legacy backlog** — `is_legacy` entries needing curation, worst first (no screen
  text, alpha channel, aspect outside every device range).

---

## 3. Capture flow — `/admin/capture`

Your own upload path, and the one place tap count genuinely matters.

1. Camera or photo picker, multi-select. Most captures are batches.
2. For each image, **device and OS are derived, not asked** — dimensions against
   `device_types` ranges, plus the vision call's `detected_os`. Shown as a single
   confirmable line: "Phone · iOS ✓".
3. App name autocompletes; recent apps are one tap.
4. Title has a suggested value from the vision description, editable.
5. Tags pre-selected from `suggested_tags`.
6. **Publish direct**, bypassing the queue. `source: 'admin'` skips review because
   you are the reviewer.

The public form asks explicitly (03) and this one derives. That is a deliberate
asymmetry, not an inconsistency: a stranger submitting once should think about the
answer, and you uploading twelve screenshots should not re-answer the same question
twelve times.

Add to home screen as a PWA so it opens like an app. No offline support — uploads
need the network and a queued-offline upload is a lie about whether something was
saved.

---

## 4. Wanted — zero-result searches

A panel beside the queue, reading `search_log` where `results = 0`, grouped and
ranked by frequency over the last 30 days.

The queue answers "what have people offered me". This answers "what do people want
that I do not have". They are two halves of one job and belong on one screen. Forty
searches for "empty cart" with nothing to show is not analytics — it is a shopping
list for the next capture session, and it is what makes opening the admin useful on
a day when the queue is empty.

Costs nothing extra: the data is already in D1 from 02.

---

## 5. The agent

**Authority in phase 1: reject clear rule violations, recommend on everything else.
It never publishes.** A wrong rejection is recoverable and visible in the
auto-rejected panel; a wrong publication is not.

### It does not look at the image

Ingest (02) already ran the vision call and stored `screen_text`, `description`,
`suggested_tags`, `detected_os`, `has_device_frame`, `has_annotations` and
`is_empty_state`. The agent reasons over that plus `checks_json` and a corpus
similarity query.

This is the main structural decision in this spec. A second vision pass would double
the cost, take a second opinion from the same model as if independent, and add a
failure mode. The agent's job is judgement over evidence already gathered.

### Rubric

**Reject** when any is true:
- a hard check failed (already handled in 03; recorded for completeness)
- `has_device_frame` — rule 5
- `has_annotations` — rule 6
- `is_empty_state === false` and confidence is high — not an empty state at all
- exact perceptual-hash duplicate of a published entry

**Flag for review** when:
- `detected_os` disagrees with the declared OS
- aspect ratio outside the declared device's range
- near-duplicate below the exact threshold
- an unlisted device or OS was proposed
- vision fields are missing because the call failed

**Recommend publish** when checks pass, nothing disagrees, and the app is not
already over-represented — twelve entries from one app is a collection, forty is a
fan site.

### Phase 2: auto-approval

Not built until there is evidence to set the threshold on. The calibration set is
the record of agent recommendations against your actual decisions, which accumulates
from day one because every review stores both.

Ship auto-approval when, over at least 100 reviewed submissions, agreement on
"recommend publish" exceeds a threshold you choose after seeing the real
distribution. Start with a narrow slice — a known app, a passing check set, a
confident `is_empty_state` — rather than a global confidence number.

Plausible's Business plan makes a second signal available later: whether
auto-approved entries get opened at rates comparable to hand-picked ones. Worth
having, not worth blocking on.

---

## 6. Verification

- [ ] `/admin` unreachable without Access; JWT verified, not just the email header
- [ ] Queue renders one submission at a time, image taking maximum height
- [ ] Publish is one tap; actions reachable one-handed on a 390px viewport
- [ ] Reject cannot complete without a reason
- [ ] Clean submissions show no warnings at all
- [ ] Capture flow derives device and OS and needs no dropdown interaction
- [ ] Capture publishes direct, bypassing the queue
- [ ] Device-type proposal can be mapped or promoted; new type appears in facets
- [ ] Agent rejects a framed mockup and a screenshot with annotations
- [ ] Agent flags rather than rejects an OS disagreement
- [ ] Agent makes no vision call of its own — verify in Workers AI request logs
- [ ] Wanted panel shows grouped zero-result searches
- [ ] Every review stores both the agent recommendation and your decision
- [ ] DLQ messages are visible and retryable
