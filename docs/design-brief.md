# EmptyStates — component brief

The components below serve a reference gallery of empty-state screenshots taken
from real software: 235 entries at launch, growing by public submission, where
one entry is a screenshot plus its metadata.

This brief names each component, its variants, its states, and the data shape it
has to survive. It sets no visual direction.

## Components

### Cell

One entry inside any grid. Wraps an image and its metadata, and the whole cell
is a link to that entry.

- **Variants:** cropped, where the cell height is fixed and the width follows the
  image's aspect ratio; contained, where the cell is square and the image sits
  whole inside it.
- **States:** rest, hover, focus, visited.
- Metadata appears on hover and on keyboard focus alike.
- Declares the image's intrinsic width and height, so nothing moves as the
  image loads.

### Responsive image

One screenshot at whichever stored width suits the cell.

- **Variants:** three generated widths (640, 1280, 2560), and a fourth case
  serving the original file.
- 206 of 235 entries have only the smallest generated width; 29 have more.
  Eight have none and use the original.
- Aspect ratios across the corpus run from 0.40 to 3.27, so no variant may
  assume portrait or landscape.

### Metadata list

App name, operating system, device type, tags, publication date, and a link to
the original file.

- **Variants:** inline, inside a cell; stacked, beside a full-size entry.
- **States:** complete; missing app name; missing operating system; missing
  both.
- The incomplete states are the common ones — 178 of 235 entries carry no app
  name and 137 carry no operating system — so a form that only reads well when
  full is the wrong form.

### Facet control

One filter value with the count of entries carrying it.

- **States:** available, selected.
- Only values that at least one published entry carries are ever rendered, so
  this component has no zero-count state and no empty result behind it.

### Tag

A link that filters the gallery to one tag. 25 distinct values.

### Pagination control

Movement across pages of 60 entries.

- **States:** first page, middle, last page, single page.

### Adjacent navigation

Previous and next entry in publication order.

- **States:** both available, first entry, last entry.

### View toggle

Switches between the two layout modes. The choice is remembered per device.

- **States:** one per mode.

### Search field

Text entry for full-text search across title, app name, tags, colour names and
extracted screen text.

- **States:** rest, focus, populated, submitting.

### Empty state

Shown when a search matches nothing, or a facet holds nothing.

This system documents empty states, so readers will judge this component
against the collection it sits inside.

### Form controls

For contributing a screenshot: file input, text input, select, submit.

- **States:** rest, focus, invalid, disabled, submitting.
- **Messages:** accepted formats, size limit, rejected file, submission
  accepted and awaiting review.

### Opt-out control

Sets whether the reader is counted by analytics.

- **States:** opted in; opted out on this device; opted out by a browser
  setting, where the control cannot be changed here.

### Header

Site name as a home link, facet controls, an entry point to search, and the
view toggle.

### Footer

A one-line description of the site and a link to the privacy page.

### Original-file link

Points at the unmodified source image and states its size in bytes.

## Layout primitives

### Justified row

A row of equal height holding cropped cells, each cell's width set by its
image's aspect ratio.

Row height derives from the viewport so a fixed count of rows is visible
without scrolling: two rows at large and medium widths, one and a half at small,
where the partial row tells the reader more sits below.

### Square grid

Uniform square cells holding contained images.

### Grid gap

A consistent gap between cells in both primitives, reading as one continuous
grid.

## Constraints every component inherits

1. Pages render on the server; interactive parts mount afterwards, and both
   sides of that handoff produce the same layout.
2. Images load from object storage and never pass through the application
   server.
3. Titles are unreliable at launch: 152 of 235 are a placeholder taken from the
   filename and read as machine output until a later pass replaces them.
