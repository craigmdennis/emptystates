# EmptyStates — functional and structural brief

A reference gallery of empty-state screenshots taken from real software. 235
entries at launch, growing by public submission. One entry is one screenshot
plus its metadata.

This brief describes what each view does and how its content is organised. It
sets no visual direction.

## What an entry carries

| Field | Notes |
|---|---|
| Title | Always present. 152 of 235 are a placeholder taken from the filename and will read as machine output until backfilled. |
| App name | Absent on 178 of 235. |
| Device type | One of phone, tablet, desktop, tv, console, watch. Always present. |
| Operating system | One of ios, android, web, macos, windows, linux. Absent on 137 of 235. |
| Tags | 25 distinct values across the corpus. An entry may carry none. |
| Dimensions | Width, height and aspect ratio, stored per entry. |
| Publication date | Orders the gallery and the previous/next links. |
| Description, screen text | Extracted later by a vision model. Absent at launch. |
| Original image | A link to the source file, with its size in bytes. |
| Related entries | Editor-curated links between entries. 25 exist. |

## Views

### Gallery

The landing view. Paginated at 60 entries per page. Two layout modes, chosen by
the reader and remembered on that device.

**Justified rows.** Rows of equal height. Each entry's width follows its aspect
ratio, and images crop to fill their cell. Row height derives from the viewport
so a fixed count of rows is visible without scrolling: two rows on large and
medium viewports, one and a half on small, where the partial row tells the
reader more content sits below.

**Square.** A uniform grid of square cells. Each image sits whole inside its
cell with space around it. Nothing crops.

In both modes every cell is a link to that entry's detail view, and cells are
separated by a consistent gap that reads as a continuous grid. A cell reveals
the app name, operating system and device type on hover.

Every image declares its intrinsic width and height, so the layout must not
move as images load.

### Detail

One entry. The screenshot is the primary element and fills the available
viewport height. Accompanying it: title, app name, device, operating system,
tags, publication date, and a link to the original image stating its file size.
Previous and next links step through the gallery in publication order. Curated
related entries appear as links where they exist.

### Filtered gallery

The gallery narrowed to one facet — device type, operating system, or tag —
reached from the filter controls or from a tag on a detail page. Facet controls
offer only values that at least one published entry carries, each with its
count, so no control returns an empty result. Pagination and both layout modes
behave as in the unfiltered gallery.

### Search results

Full-text search across title, app name, tags, colour names and extracted
screen text. Results use the same cell and both layout modes.

A query matching nothing needs a considered empty state of its own. This is a
gallery of empty states, and readers will judge it.

### Submission

A form for contributing a screenshot: image upload, app name, app URL, device,
operating system, and an optional contributor name and handle. States needed
for accepted formats, the size limit, a rejected file, and a successful
submission awaiting review.

### Privacy

A text page carrying a control that opts the reader out of analytics, and
showing whether the reader is already opted out through a browser setting.

## Structure common to every page

A header carrying the site name as a home link, the filter controls, an entry
point to search, and the layout-mode toggle. A footer carrying a one-line
description of the site and a link to the privacy page.

## Constraints the layouts must survive

1. Aspect ratios run from 0.40 to 3.27. A layout assuming portrait or landscape
   fails on this corpus.
2. Three stored image widths exist — 640, 1280 and 2560 — and only 29 entries
   have anything above 640. Layouts cannot assume a large source image.
3. Eight entries are narrower than 640 pixels and are served at their original
   size.
4. Images load from object storage and never pass through the application
   server.
5. 137 entries carry no operating system and 178 carry no app name, so every
   place metadata appears needs a form that reads correctly when it is missing.
6. Pages render on the server; interactive parts mount afterwards and must
   produce the same layout either side of that handoff.
