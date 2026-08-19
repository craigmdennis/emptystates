# Handoff: EmptyStates reference gallery

## Overview
EmptyStates is a reference gallery of empty-state screenshots collected from real software. 235 entries at launch, growing by public submission. One entry = one screenshot plus metadata (title, app name, device type, OS, tags, publication date, link to the original file).

This handoff covers nine surfaces: gallery in two layouts, layout switch, faceted filters, pagination, detail view, search, no-results state, submission form (with rejected/accepted/submitted states), privacy page with an analytics opt-out, and the shared header/footer.

## About the Design Files
The file in this bundle (`EmptyStates.dc.html`) is a **design reference created in HTML** — a working prototype showing intended look and behaviour, not production code to copy. It uses a small in-house streaming component runtime (`support.js`, also bundled) and inline styles throughout; do not port that runtime.

The task is to **recreate these designs in the target codebase's existing environment** (React, Vue, Svelte, Rails views, whatever is in place) using its established patterns, component library, and styling approach. If no environment exists yet, pick the most appropriate framework and implement there. Screenshot imagery in the prototype is a striped grey placeholder; real `<img>` elements replace it.

## Fidelity
**High-fidelity.** Colors, typography, spacing, radii, states, and copy are final and should be matched closely. Layout maths (justified row packing, square-cell inset scaling, FLIP transition) is specified below precisely enough to reimplement.

## Screens / Views

### 1. Header (every page)
- Sticky, `top: 0`, `z-index: 40`. Background `rgba(233,233,233,0.94)` with `backdrop-filter: blur(8px)`. Bottom border `1px solid #cfcfcf`.
- Inner: `max-width: 1560px`, centered, `padding: 0 24px`, `height: 48px`, flex, `align-items: center`, `gap: 24px`.
- Left: wordmark "EMPTYSTATES" — 15px / 500 / `letter-spacing: 0.14em` / uppercase, next to "235 entries" in JetBrains Mono 11px `#7a7a7a`, baseline aligned, `gap: 10px`. Links home and clears search.
- Center: search field (see §6).
- Right: nav "Submit" and "Privacy" — JetBrains Mono 11px, `letter-spacing: 0.04em`, uppercase, `#616161`; hover `#111111`; `gap: 20px`.

### 2. Gallery toolbar
Flex row, `padding: 12px 0 10px`, `justify-content: space-between`, wraps.
- **Left — facet chips** (Device, OS, Tags), `gap: 8px`. Chip: `height: 32px`, `padding: 0 14px`, `border-radius: 999px`, 13px, `background: #dfdfdf`, `border: 1.5px solid transparent`. Hover `background: #d2d2d2`. Active (a value selected): `background: #fdfdfd`, `border: 1.5px solid #333333`. Contents: label, current value in JetBrains Mono 10px `#7a7a7a`, and a 5px chevron (rotated 45° square with right+bottom borders `#7a7a7a`).
- A "Clear" text button (JetBrains Mono 10px uppercase `#7a7a7a`, hover `#111111`) appears when any filter is set.
- **Right** — range readout ("1–60 of 235", JetBrains Mono 11px `#7a7a7a`) then the layout switch.

### 3. Facet popover
- Absolutely positioned, `top: calc(100% + 6px)`, `left: 0`, `z-index: 30`, `min-width: 224px`, `max-height: 320px`, scrolls. `background: #fdfdfd`, `border: 1px solid #d7d7d7`, `border-radius: 14px`, `box-shadow: 0 10px 30px rgba(17,17,17,0.12)`, `padding: 6px`.
- Rows: full width, `height: 30px`, `padding: 0 12px`, `border-radius: 999px`, 13px, label left, count right in JetBrains Mono 10px `#8e8e8e`. Hover `background: #d2d2d2`. Selected single-select row: `background: #dfdfdf`, text `#111111`.
- First row is always "Any" with the total count; the OS facet labels it "Any (137 unrecorded)" to disclose the missing-metadata reality.
- **Device and OS are single-select** (picking closes the popover). **Tags are multi-select**: each tag row carries a 13px checkbox (`border-radius: 3px`, `1.5px solid #c2c2c2`; checked `background: #111111`, border `#111111`), the popover stays open, and filtering is AND across selected tags. The chip label reads `tag` for one selection and `tag +N` for several.
- Dismissal: document-level `pointerdown` capture handler that closes unless the event target is inside `[data-facet]`, plus `Escape`. Both must be unregistered on unmount.

### 4. Gallery — justified rows
Row height is derived from the viewport so a fixed number of rows is visible without scrolling.
- `gap`: 8px default (2–24 exposed as a knob), applied both between cells in a row and between rows.
- Rows visible: **2** on desktop/tablet, **1.5** on mobile (container width < 700px). `chrome` allowance subtracted from viewport height: 190px desktop, 210px mobile.
- `target = clamp(120, 430, (viewportH - chrome - gap * ceil(visible - 1)) / visible)`.
- Packing: walk entries accumulating aspect ratios; close a row when `sumAspect * target + gap * (n - 1) >= containerWidth`. On close, scale factor `k = availableWidth / (sumAspect * target)`; each cell width `floor(aspect * target * k)`; rounding remainder added to the last cell so rows are flush. Row height stays `round(target)` for every row (equal-height rows, not classic justified variable heights). A trailing incomplete row is laid out at `target` height, left-aligned, unjustified.
- Cell: `overflow: hidden`, background `#dfdfdf`, image fills the cell (`width/height: 100%`, `object-fit: cover`) — cropping is expected.
- Hover/focus reveals a gradient overlay: `linear-gradient(to top, rgba(17,17,17,0.94), rgba(17,17,17,0.64) 62%, rgba(17,17,17,0))`, `min-height: 30px`, `padding: 8px 9px`, `opacity` 0→1 over 120ms. Text = app name · OS · device joined by "  ·  ", JetBrains Mono 10px `#e9e9e9`, single line, ellipsised. Absent fields are dropped, never rendered as "Unknown".

### 5. Gallery — square grid
- Column count from a min cell size: 140px (<560px container), 168px (<900px), else 196px; `cols = max(2, floor((W + gap) / (min + gap)))`; `size = floor((W - gap*(cols-1)) / cols)`.
- Cell: `size × size`, `background: #f8f8f8`, `border: 1px solid #d4d4d4` (hover `#ababab`), `padding-bottom: 24px` to reserve the caption strip, image centered.
- Image is shown whole, never cropped, and **never upscaled**: available box `inner = size - 52`; fit the aspect ratio inside `inner`, additionally capped at the screenshot's natural width. Space around it on all sides.
- Caption strip: always visible (not hover-gated), absolute bottom, `height: 26px`, `padding: 0 10px`, text = the **entry title**, JetBrains Mono 10px, `#7a7a7a` resting / `#111111` on hover, single line ellipsised. Placeholder filename titles are set `direction: rtl` so truncation eats the head and keeps the distinctive tail visible.
- A dimensions badge (`640×1136`, JetBrains Mono 9px `#9a9a9a` on `rgba(248,248,248,0.85)`) sits on the placeholder; it is hidden when the cell's smaller side is ≤96px, and can be switched off entirely.

### 6. Layout switch
Single pill track with a sliding thumb — not two buttons.
- Track: `position: relative`, flex, `gap: 2px`, `padding: 2px`, `border-radius: 999px`, `background: #dfdfdf`; **hover on the whole track** → `#cbcbcb`.
- Thumb: absolute, `top/left: 2px`, `38 × 28`, `border-radius: 999px`, `background: #111111`, `z-index: 1`, `pointer-events: none`; `transform: translateX(0 | 40px)` with `transition: transform 170ms cubic-bezier(0.4,0.05,0.2,1)`.
- Buttons: `38 × 28`, transparent, `z-index: 2` so their icons sit above the thumb. Icons are CSS shapes: justified = three vertical bars 11px tall (widths 5/9/3, `gap: 2px`), square = 2×2 grid of squares in an 11px box. Icon color `#7a7a7a`, or `#e9e9e9` when that side is active (i.e. sitting on the dark thumb).
- Selection persists per device in `localStorage` under `emptystates.layout`.
- **Layout transition (FLIP).** Before the state change, record `getBoundingClientRect()` of every `[data-cell]`. After render, for each cell compute `dx/dy` and `sx/sy` against the new rect and run `element.animate()` from `translate(dx,dy) scale(sx,sy)` with `transform-origin: top left` to `none`, `duration: 340ms`, `easing: cubic-bezier(0.3,0.02,0.2,1)`; the inner image fades `0.35 → 1` over 300ms. Skip cells that moved <1px and scaled <1%. Skip the whole animation under `prefers-reduced-motion: reduce`.

### 7. Search
- Field: `max-width: 460px`, `height: 36px`, `border-radius: 999px`, `background: #f8f8f8`, `border: 1px solid #cfcfcf`, 14px, `padding: 0 44px 0 36px`. Focus: `border-color: #ababab`, `box-shadow: 0 0 0 3px rgba(17,17,17,0.07)`. Placeholder "Search", accessible label "Search 235 entries".
- 15px magnifier SVG at `left: 13px` (circle r 5.4 at 8.6,8.6 + line to 17,17, stroke `#6b6b6b` 1.7).
- Right side, empty state: a "/" key badge — `21 × 21`, `border: 1px solid #d7d7d7`, `border-radius: 5px`, `background: #fdfdfd`, JetBrains Mono 11px italic `#8e8e8e`. A global `keydown` on "/" (ignored inside form fields, ignored with meta/ctrl) focuses the field.
- Right side, with a query: a × clear button, `22 × 22`, round, `#7a7a7a`, hover `#111111` on `#dfdfdf`. `Escape` clears.
- Results reuse the gallery cells and the current layout, with a summary line above: "N entries match “query”" in JetBrains Mono 11px `#616161`, on a `1px solid #cfcfcf` rule. Matching is a case-insensitive substring across title, app, device, OS, and tags, intersected with active facets.

### 8. No-results state
Left-aligned block, `max-width: 560px`, `padding: 72px 0 96px`, above a `1px solid #cfcfcf` rule.
- Eyebrow "0 RESULTS" — JetBrains Mono 11px, `letter-spacing: 0.08em`, uppercase, `#8e8e8e`.
- Headline, Spectral 33px / 400 / `line-height: 1.2`: `Nothing in the collection matches “{query}”.`
- Body 15px / 1.6 / `#616161`, `text-wrap: pretty`: "This is the two hundred and thirty-sixth empty state on the site, and the only one nobody submitted. It will keep appearing until someone does."
- Buttons, `gap: 10px`, `height: 34px`, `border-radius: 2px`: primary "Browse all 235 entries" (`#111111` on white text, hover `#111111`), secondary "Submit a screenshot" (`1px solid #cfcfcf`, hover border `#111111`).
- Below a rule: "WELL-POPULATED TAGS" eyebrow and the six highest-count tags as pill chips (`height: 30px`, `padding: 0 13px`, `background: #dfdfdf`, hover `#d2d2d2`, count in JetBrains Mono 10px `#8e8e8e`). Picking one clears the query and applies that tag.

### 9. Detail view
- Top bar: "← GALLERY" back button (JetBrains Mono 11px uppercase `#616161`) left; right side "n / total" in `#8e8e8e` plus Prev / Next buttons stepping through the **current filtered order**, disabled at the ends.
- Body: grid `minmax(0,1fr) 300px` with `gap: 40px`, single column when available width < 620px. `padding: 24px 0 56px` under a `1px solid #cfcfcf` rule.
- Image: shown at natural size, never upscaled; capped at available width (`contentWidth - 340` in two-column) and at 74% of viewport height (52% single column). Caption under it, JetBrains Mono 10px `#8e8e8e`: "actual size · 640×1136" or "shown at 62% · 1280×980".
- Title: real titles in Spectral 23px / 400 / 1.3. Placeholder filename titles instead render in JetBrains Mono 15px, `word-break: break-all`, `#333333`, with a 12px `#8e8e8e` note beneath: "Original filename. No title recorded yet."
- Metadata `<dl>`: grid `88px 1fr`, `row-gap: 11px`, `column-gap: 16px`. Keys JetBrains Mono 10px uppercase `#8e8e8e`; values 13px (dates and counts in mono 12px). Rows are **omitted when absent** — only Device, Published, and Entry are guaranteed. Absent fields are instead summarised once, quietly: "Not recorded: app name, operating system" in JetBrains Mono 10px `#a0a0a0`.
- Tags as pill chips (`height: 28px`, `padding: 0 12px`) that jump back to the gallery filtered to that tag.
- Original-file link above a rule: label 13px `#111111` (hover underline) with "PNG · 214 KB · 640×1136" in JetBrains Mono 10px `#8e8e8e`.

### 10. Submission form
`max-width: 620px`, `padding: 32px 0 64px`. Eyebrow "SUBMIT", Spectral 29px headline "Add a screenshot", 14px/1.65 `#616161` intro that explicitly tells contributors to leave unknown fields blank.
- **Empty upload**: label acting as a drop zone — `height: 148px`, `border: 1px dashed #b8b8b8`, `border-radius: 2px`, `background: #f8f8f8`, centered 14px "Drop an image here, or choose a file" plus JetBrains Mono 10px `#8e8e8e` "PNG, JPG, GIF or WebP · 8 MB maximum". Visually hidden `<input type="file">`.
- **Rejected**: dashed border turns `oklch(0.55 0.16 28)`; below it a message block with a `2px` left border in the same red, 13px `oklch(0.45 0.14 28)` text naming the actual file, type and size ("presentation.pdf is application/pdf at 12.4 MB. Images only, under 8 MB."), and a mono 10px reassurance "Nothing was uploaded. The rest of the form is unchanged." Accept rule: MIME in png/jpeg/gif/webp and size ≤ 8 MiB.
- **Accepted**: card `1px solid #cfcfcf` on `#f8f8f8`, `padding: 14px`, with a 40×56 thumbnail, filename in JetBrains Mono 12px (ellipsised), "214 KB · PNG" in mono 10px `#8e8e8e`, and a "Replace" button.
- Fields: two-column grid, `gap: 20px` — App name (optional), App URL (optional), Device select (Desktop / Phone / Tablet / Watch / Not sure), OS select (Not sure / iOS / Android / macOS / Windows / Web). "Not sure" is the OS default, matching the collection.
- Credit section above a rule, eyebrow "CREDIT — OPTIONAL": Your name, and Handle as a `104px minmax(0,1fr)` pair — a platform select (Platform / Mastodon / Bluesky / X / Instagram / GitHub / LinkedIn / Threads / Website) beside an "@" text input.
- All inputs/selects: `height: 36px`, `padding: 0 14px`, `border-radius: 999px`, `background: #f8f8f8`, `border: 1px solid #cfcfcf`, 14px; focus `border-color: #111111`, `box-shadow: 0 0 0 3px rgba(17,17,17,0.16)`. Labels JetBrains Mono 10px uppercase `#616161`, `margin-bottom: 8px`.
- Submit button `height: 34px`: `#111111` when a file is accepted, `#b5b5b5` otherwise, with a mono 10px hint beside it ("A screenshot is required." / "Reviewed by hand before publication."). Submitting without a file sets the rejected message "A screenshot is required. Everything else is optional."
- **Submitted**: replaces the form with a card — "RECEIVED" eyebrow in `#111111`, 15px "Queued for review. Screenshots are checked by hand, usually within a week.", and a "Submit another" button. No entry number is shown.

### 11. Privacy page
`max-width: 620px`. Eyebrow "PRIVACY", Spectral 29px "What this site records", two 15px/1.7 `#333333` paragraphs on what is collected and what submissions store.
- Opt-out card: `1px solid #cfcfcf` on `#f8f8f8`, `padding: 22px`. Title "Opt out of analytics" 14px/500, state line 13px `#616161`.
- Switch: `44 × 26`, `border-radius: 13px`; off `background: #dfdfdf`, `border: 1px solid #cfcfcf`; on `background: #111111`, `border-color: #111111`. Knob `20 × 20` white, `left: 2px → 20px`, `transition: left 130ms ease`, `box-shadow: 0 1px 2px rgba(17,17,17,0.28)`. `role="switch"`, `aria-checked`. Choice stored in `localStorage` as `emptystates.optout`.
- State copy: on → "On. Aggregate page views only, no cookies or identifiers."; off → "Off. Nothing is recorded for this browser. The choice is stored locally, not on a server."
- **Browser already opted out (DNT/GPC)**: switch reads on, is `disabled`, `cursor: not-allowed`, `opacity: 0.75`, muted colors (`#e6e2db` fill, `#b5b5b5` border); state line becomes "Off. Nothing is being recorded for this visit."; and an explanatory note appears above a `1px solid #dcdcdc` rule in JetBrains Mono 10px/1.7 `#7a7a7a`: "Your browser is sending a Do Not Track signal, which this site honours before anything else. No analytics run on your visit, and this switch is locked because there is nothing left for it to turn off. If you turn Do Not Track off in your browser settings, the switch here becomes yours to set."
- Footnote: "Last changed 12 June 2026 · removal requests: remove@emptystates.gallery".

### 12. Footer (every page)
`border-top: 1px solid #cfcfcf`, `background: #dfdfdf`, inner `max-width: 1560px`, `padding: 18px 24px 22px`. Baseline-aligned flex, wraps. All JetBrains Mono 10px, `letter-spacing: 0.04em`, `#7a7a7a`. Left: "Emptystates — 235 empty-state screenshots from real software. Growing by submission." Right, `gap: 20px`: Submit, Privacy, "Screenshots belong to their authors".

## Interactions & Behavior
- Navigation is client-side between five views: gallery, search, detail, submit, privacy. In a real app these are routes: `/`, `/?q=`, `/e/:id`, `/submit`, `/privacy`, with filters and page in the query string so state is shareable.
- Filters and search reset pagination to page 1; opening a detail or another page scrolls to top.
- Every cell is a link (`<a>`) to its entry. Focus ring: `outline: 2px solid #111111`, `outline-offset: 2px`. Keyboard focus reveals the same hover metadata as the mouse.
- Pagination: 60 per page. Bar above a rule, `margin: 28px 0 56px`. Previous / Next buttons `height: 30px`, `padding: 0 12px`, `border-radius: 2px`, JetBrains Mono 11px; enabled `1px solid #cfcfcf` `#111111`, disabled `1px solid #dcdcdc` `#b5b5b5` with `cursor: default`. Numbered buttons `min-width: 30px`, current `background: #111111` white text. Only rendered when more than one page exists. (The prototype lists all page numbers; with 4 pages that is fine — add ellipsis truncation if the collection grows past ~10 pages.)
- Transitions used: layout FLIP 340ms, thumb slide 170ms, overlay fade 120ms, switch knob 130ms. Nothing else animates.
- `prefers-reduced-motion` disables the FLIP animation.

## State Management
- `layout`: 'justified' | 'square' — persisted, `localStorage['emptystates.layout']`.
- `query`: string; `screen` derives to 'search' when non-empty.
- `device`: string | null; `os`: string | null; `tags`: string[] (AND-combined).
- `page`: number, clamped to the filtered total.
- `openFacet`: 'device' | 'os' | 'tags' | null.
- `hoverId`, `detailId`.
- `submitState`: 'idle' | 'rejected' | 'accepted' | 'submitted', plus `fileName`, `fileMeta`, `rejectReason`.
- `optOut`: boolean — persisted, `localStorage['emptystates.optout']`; forced true and locked when the browser signals DNT/GPC.
- Measured: container width, viewport width, viewport height (ResizeObserver on the gallery + window resize) — the justified row height and the square column count both depend on these.
- Data: the prototype generates 235 synthetic entries; the real app fetches them. Entry shape: `{ id, title, placeholderTitle, app, device, os, tags[], date, w, h, bytes }`. Facet counts are computed from the full collection, not the filtered subset.

## Design Tokens
Colors
- Page ground `#e9e9e9`; header ground `rgba(233,233,233,0.94)`; footer / chip ground `#dfdfdf`; chip hover `#d2d2d2`; track hover `#cbcbcb`.
- Surfaces `#f8f8f8`, `#fdfdfd`. Borders `#cfcfcf`, `#d7d7d7`, `#d4d4d4`, `#dcdcdc`.
- Ink `#111111`; secondary `#333333`; muted `#616161`; mono/meta `#7a7a7a`, `#8e8e8e`; faint `#9a9a9a`, `#a0a0a0`, `#ababab`, `#b5b5b5`, `#b8b8b8`, `#c2c2c2`.
- Placeholder stripe: `repeating-linear-gradient(45deg, #d9d9d9 0 5px, #e3e3e3 5px 10px)` on `#dfdfdf` with `inset 0 0 0 1px rgba(17,17,17,0.09)`.
- Error `oklch(0.55 0.16 28)` border / `oklch(0.45 0.14 28)` text.
- Overlay gradient `rgba(17,17,17,0.94) → 0.64 at 62% → 0`.
- Focus ring `#111111`; input focus glow `rgba(17,17,17,0.16)`, search `rgba(17,17,17,0.07)`.

Typography
- Body/UI: "Helvetica Neue", Helvetica, Arial, sans-serif. Sizes 10 / 12 / 13 / 14 / 15px.
- Headings: Spectral 400 — 23px (detail), 29px (page), 33px (no-results), `line-height` 1.2–1.3.
- Metadata/labels: JetBrains Mono 400/500 — 9 / 10 / 11 / 12px, `letter-spacing` 0.02–0.08em, uppercase for labels.

Radii: 2px (rects, buttons), 3px (checkbox), 5px (key badge), 13px (switch), 14px (popover), 999px (chips, inputs, switch track, layout pill).

Spacing: 2 / 6 / 8 / 10 / 14 / 16 / 20 / 24 / 32 / 40px. Gallery gap 8px (2–24 range). Content max-widths 620px (prose/forms), 1560px (page).

Shadows: `0 10px 30px rgba(17,17,17,0.12)` (popover), `0 1px 2px rgba(17,17,17,0.28)` (switch knob).

## Assets
- Fonts: JetBrains Mono 400/500 and Spectral 400/500 from Google Fonts; Helvetica Neue is system.
- No image assets. Screenshots are placeholders (striped grey blocks with a dimensions badge) — replace with real `<img>` elements. In justified rows use `object-fit: cover`; in the square grid use natural size within the computed inset box and never upscale.
- Icons are CSS/SVG shapes drawn inline (magnifier, chevron, layout icons, checkbox) — swap for the codebase's icon set if it has equivalents.

## Content constraints to honour
1. Aspect ratios span 0.40–3.27; no single cell shape fits everything — hence the two layouts.
2. 206 of 235 screenshots are ≤640px wide; never upscale and never build a layout that depends on large imagery.
3. 178 entries have no app name, 137 no OS — metadata rows are omitted rather than filled with "Unknown", and absences are summarised once on the detail view.
4. 152 titles are placeholder filenames — these render in monospace, truncate from the left in grid captions, and carry an explicit note on the detail view.
5. Screenshots are the subject; chrome stays quiet — small type, grey palette, one dark accent, no decorative color.

## Files
- `EmptyStates.dc.html` — the full design: all views, states, layout maths, and the logic class at the bottom of the file.
- `support.js` — the prototype's runtime, included only so the HTML opens locally. Not part of the design.
