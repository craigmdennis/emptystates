Design the interface for EmptyStates, a reference gallery of empty-state
screenshots collected from real software. 235 entries at launch, growing by
public submission. One entry is one screenshot plus its metadata: title, app
name, device type, operating system, tags, publication date, and a link to the
original image file.

## The two gallery layouts

The reader switches between them, and the choice is remembered on that device.

**Justified rows.** Rows of equal height. Each screenshot's width follows its
own aspect ratio, and images crop to fill their cell. Row height comes from the
viewport so a fixed number of rows is visible without scrolling: two rows on
desktop and tablet, one and a half on mobile, where the partial row shows that
more sits below.

**Square grid.** Uniform square cells. Each screenshot sits whole inside its
cell with space around it, cropped nowhere.

In both layouts every cell links to its entry, a consistent gap separates the
cells, and a cell reveals its app name, operating system and device type on
hover and on keyboard focus.

## Design these

1. The gallery in both layouts, and the control that switches between them.
2. Filter controls for device type, operating system and tag, each showing how
   many entries carry that value.
3. Pagination across pages of 60 entries.
4. A detail view: the screenshot at full size, its metadata, previous and next
   links through the collection, and a link to the original file showing its
   size.
5. Search: a field, and a results view reusing the gallery cells.
6. The state for a search matching nothing. This site documents empty states,
   so readers will judge this screen against the collection it sits inside.
7. A submission form — image upload, app name, app URL, device, operating
   system, and an optional contributor name and handle — including its
   rejected-file and accepted states.
8. A privacy page carrying a control that opts the reader out of analytics,
   including the state where a browser setting has already opted them out.
9. The header and footer common to every page.

## Constraints from the real content

1. Aspect ratios run from 0.40 to 3.27. No single cell shape fits the whole
   collection.
2. 206 of the 235 screenshots are 640 pixels wide or less, so nothing can rest
   on large imagery.
3. 178 entries carry no app name and 137 carry no operating system. Metadata
   has to read correctly when most of it is absent.
4. 152 titles are placeholder filenames such as
   `tumblr_mgbxptW6cA1rdf37to1_1280`, and stay that way until a later pass
   replaces them.
5. Screenshots are the subject. Chrome around them competes with the thing
   being shown.
