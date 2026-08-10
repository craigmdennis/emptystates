# 02 — Ingest and search

**Date:** 2026-08-11
**Parent:** `2026-08-10-emptystates-architecture.md`
**Depends on:** 01
**Phase:** 1

## Scope

One queue-driven ingest pipeline that turns an image into a searchable entry, and
the search layer built on what it produces. Backfills the legacy corpus through the
same path.

**Out of scope:** the submission form and its rule enforcement (03) — this spec
provides the pipeline that 03 calls, and the check *primitives* it uses, but not the
policy.

---

## 1. The ingest pipeline

One Queue consumer. Three producers — public submission, admin capture, legacy
backfill — all enqueue the same message shape:

```ts
type IngestMessage = {
  submissionId: string
  r2Key: string          // submissions/<id>.<ext> or originals/<id>.<ext>
  source: 'public' | 'admin' | 'backfill'
}
```

A queue rather than a request handler because retries are free, the submitter is not
kept waiting, and backfill is the same code rather than a script that drifts.

### Steps

**1. Read bytes from R2.** Fail the message if absent — R2 write and enqueue are not
atomic, so a message can arrive marginally early. Retry handles it.

**2. Decode and measure.** `sharp` gives `width`, `height`, `hasAlpha`, `format`,
`size`. These are the *authoritative* values. Anything a client claimed is
discarded — rules depend on these, so they are re-derived from the bytes.

**3. Generate variants.** WebP at 640px and 1280px wide, quality 82, written to
`w640/` and `w1280/`. Never upscale: an image narrower than 1280 gets only `w640`,
and the card falls back. Originals are never modified.

**4. Extract colour.** Section 2.

**5. Vision call.** Section 3.

**6. Write.** In one transaction: `states` (or `submissions`, for public source),
`state_tags`, `state_colors`, and the `states_fts` row. Never partially.

Steps 2–4 are real CPU, in the low hundreds of milliseconds — trivial inside the
15-minute consumer budget, impossible on the free plan's 10ms. Step 5 is a
subrequest and costs no CPU.

### Configuration

```jsonc
"queues": {
  "producers": [{ "queue": "ingest", "binding": "INGEST" }],
  "consumers": [{
    "queue": "ingest",
    "max_batch_size": 5,
    "max_retries": 3,
    "dead_letter_queue": "ingest-dlq"
  }]
}
```

`max_retries: 3` is a cost control as much as a correctness one. A poisoned message
looping against Workers AI is the one way this design can spend money unexpectedly.
The DLQ is checked by the admin area (04).

---

## 2. Colour extraction

1. Downscale to 64×64 with `sharp`, `fit: 'inside'`. Enough for dominant colour,
   cheap enough to be free.
2. Read raw RGB pixels.
3. k-means, k=5, ~10 iterations, seeded deterministically so the same image always
   yields the same palette. Reproducibility matters more than optimality here — a
   backfill that reshuffles every palette is indistinguishable from a bug.
4. Convert each centroid sRGB → linear → XYZ (D65) → CIELAB.
5. Assign a **named bucket** by nearest neighbour among ~14 reference colours in
   LAB: white, black, grey, red, orange, yellow, green, teal, blue, navy, purple,
   pink, brown, beige. Add lightness and temperature words (`dark`, `light`, `warm`,
   `cool`) as extra tokens.
6. Write five `state_colors` rows with hex, L/a/b and coverage; write the space-joined
   bucket names to `states.color_names`.

Two representations from one pass, as the parent specifies. Bucket names make colour
searchable by *typing*; LAB coordinates make a swatch picker feel accurate, because
RGB distance judges colour badly.

**Screenshots skew heavily white and grey.** Most UI is a light background, so a
naïve dominant-colour result is "white" for most of the corpus and the facet becomes
useless. Mitigation: keep all five ranks and let the swatch filter match *any* rank,
not just rank 1, so a mostly-white screen with a blue illustration is findable under
blue. Rank 1 still drives sort order.

---

## 3. Vision extraction

One Workers AI call per image, returning several fields at once.

**Model:** `@cf/moondream/moondream3.1-9B-A2B` — a vision-language model with a 32K
context, built for structured output on real-world vision tasks. Fallback
`@cf/google/gemma-4-26b-a4b-it`, which Cloudflare's own markdown conversion uses for
image description.

Requested as JSON:

```json
{
  "screen_text": "all visible text, reading order, verbatim",
  "description": "one sentence: what this screen shows and why it is empty",
  "suggested_tags": ["no-results"],
  "detected_os": "ios | android | web | macos | windows | unknown",
  "has_device_frame": false,
  "has_annotations": false,
  "is_empty_state": true
}
```

`screen_text` is not OCR and is not called that. Vision-language models read
low-contrast, anti-aliased UI type — which is most app UI, and precisely what
classical OCR mangles.

The last four fields exist for **03 and 04, not for search**. Device-frame and
annotation detection are rule checks that metadata cannot answer; `is_empty_state`
is the judgement the agent needs. Extracting them here means the agent needs no
separate "look at this image" step, because ingest already looked.

Handling:

- Validate the response against a schema. A malformed reply retries once, then the
  message completes with vision fields null. **Ingest must not fail because a model
  had a bad day** — an entry without screen text is degraded, not broken.
- `suggested_tags` are never applied automatically. They populate
  `submissions.suggested_tags_json` for one-tap acceptance in review.
- `detected_os` is compared to the declared OS; a mismatch flags for review rather
  than overriding. The submitter knows which device they used.

**Measure neuron consumption on the first hundred calls.** This is the one line of
the cost model resting on assumption. If it disappoints, move the vision call after
the deterministic checks so junk submissions cost nothing.

---

## 4. Search

### A function, not a route

```ts
export async function searchStates(db: D1Database, q: SearchQuery): Promise<SearchResult>
```

This is a **cross-cutting requirement from the parent**, not a style preference.
`/api/search`, the gallery's server render, and the phase-3 MCP server all call this
one function. If the MCP server reimplements search against the same tables they
will diverge, and the failure mode is an assistant confidently reporting results the
site itself does not return.

```ts
type SearchQuery = {
  q?: string
  device?: string[]
  os?: string[]
  tags?: string[]
  color?: string          // bucket name or hex
  from?: string; to?: string
  minWidth?: number; maxWidth?: number
  sort?: 'relevance' | 'newest'
  page?: number; perPage?: number
}
```

### Text

```sql
SELECT s.*, bm25(states_fts, 10.0, 8.0, 6.0, 4.0, 1.0, 2.0) AS rank
FROM states_fts f
JOIN states s ON s.id = f.state_id
WHERE states_fts MATCH ?
  AND s.status = 'published'
ORDER BY rank
LIMIT ? OFFSET ?;
```

Column weights, highest first: `title` 10, `app_name` 8, `tags` 6, `colors` 4,
`description` 2, `screen_text` 1.

Screen text is weighted lowest deliberately. It is the largest and least reliable
field, and unweighted it drowns everything — search `search` and forty screenshots
containing a "Search" placeholder rank alongside the six entries actually about
search. The more screen-text coverage the corpus gains, the worse unweighted search
would get.

**Sanitise the query before `MATCH`.** FTS5 syntax is not user input: bare `"`, `*`,
`NEAR`, `AND`/`OR`/`NOT` and `^` all have meaning and a stray quote is a syntax
error, not zero results. Tokenise on whitespace, strip operators, quote each term,
append `*` to the final term for as-you-type prefix matching.

### Facets

Plain `AND` clauses on indexed columns, joining `state_tags` and `state_colors`
where needed. Within a facet, values `OR` together; across facets they `AND` —
"iOS or Android, and tagged onboarding" is what people mean by pill selection.

Colour by hex sorts on CIELAB ΔE from the query colour to the *nearest* rank, not
rank 1 only.

Facet counts come from a second aggregate query over the same predicate minus that
facet's own clause — so a count never shows zero for something you can still click.

### Ranking without a query

`published_at DESC`. Relevance is meaningless with no query, and the ULID primary
key makes recency free.

### `/api/search`

Thin wrapper: parse and validate params, call `searchStates`, return JSON. Also
writes `search_log` — `query`, `results`, `facets_json`, timestamp, **no identifier
of any kind**. That table is a curation tool: the zero-result list tells you which
empty states people want and you do not have.

Debounce at 250ms on the client and fire once on commit. Not for D1's sake — the
read budget is enormous — but because these results are what the admin's
zero-result panel reads, and per-keystroke logging turns "empty cart" into eleven
prefixes of itself and destroys the signal.

---

## 5. Index maintenance

Any write to `states`, `state_tags` or `state_colors` rewrites the `states_fts` row
in the same transaction. Delete the old row by `state_id`, insert the new one.

Not triggers: FTS5 rows here are assembled from three tables, so the logic belongs
in one application function that all writers call. Triggers would spread it across
three definitions that must agree.

Drift here is the likeliest cause of "the tag pill says 12 but search says 9". A
`checkIndexIntegrity()` maintenance route compares row counts and reports mismatches
by id.

---

## 6. Backfill

After 01's migration, enqueue every legacy entry with `source: 'backfill'`. 229
messages at batch size 5 completes in minutes.

Backfill **updates** rather than inserts: `screen_text`, `description`, colours and
the FTS row are populated; `title`, `app_name`, tags and device stay as migrated.
`is_legacy` is untouched — these entries still predate the submission rules.

Vision cost for the backfill is a **one-off ~229 calls**, and it is the best
available measurement of per-call neuron cost before any public traffic exists. Run
it, read the Workers AI dashboard, and update the parent's cost model with a real
number.

---

## 7. Verification

- [ ] Queue consumer processes a message end to end and writes all four tables
- [ ] A failing vision call still produces a complete entry with null vision fields
- [ ] Malformed image → message fails cleanly and lands in the DLQ, no partial row
- [ ] Same image ingested twice yields an identical palette
- [ ] Colour filter finds a mostly-white screenshot by its accent colour
- [ ] `bm25` weighting: searching a word present in both a title and unrelated
      screen text ranks the title match first
- [ ] Query containing `"`, `*` and `AND` returns results rather than erroring
- [ ] Facet counts never show zero for a clickable option
- [ ] `searchStates` is called by both `/api/search` and the gallery render — grep
      for a second implementation and confirm there is none
- [ ] `search_log` contains no identifier of any kind
- [ ] `checkIndexIntegrity()` reports zero drift after backfill
- [ ] Workers AI neuron cost measured over the backfill and written into the parent
