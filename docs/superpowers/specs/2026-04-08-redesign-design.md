# EmptyStates Redesign — Design Spec

## Overview

Redesign emptystat.es from a Gatsby static site to an EMDash-powered CMS gallery. The site curates 235+ empty state UI screenshots across mobile, desktop, tablet, TV, watch, and game platforms. The redesign focuses on fast mobile capture, powerful filtering/search, and a utilitarian image-first browsing experience.

## Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| CMS / Framework | EMDash (built on Astro) | Full-stack TypeScript CMS |
| Hosting | Cloudflare Workers + Pages | Free tier |
| Database | Cloudflare D1 (SQLite at edge) | Content metadata, OCR text |
| Image Storage | Cloudflare R2 | Free tier (10GB, zero egress) |
| OCR | Tesseract | Runs at build time |
| Search | Client-side JSON index | Built at build time |

### Escape Hatch

Data lives in D1 + R2 independent of the CMS layer. EMDash themes are standard Astro projects. If EMDash proves too immature, the theme can be extracted to a standalone Astro site without data migration.

## Content Model

A single collection: **States**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| title | string | yes | Name of the empty state |
| image | media (R2) | yes | The screenshot |
| app_name | string | no | App or service name |
| app_url | string | no | URL to the app/service |
| device_type | select | yes | mobile, tablet, desktop, tv, watch, game |
| platform | select | no | ios, android, web, macos, windows |
| tags | multi-select | no | onboarding, error, no-results, no-content, first-run, permissions, location, illustration, text-only, etc. |
| focal_x | number (0-100) | no | Focal point X %. Defaults to 50 |
| focal_y | number (0-100) | no | Focal point Y %. Defaults to 50 |
| ocr_text | text | no | Auto-populated by Tesseract at build time. Hidden from admin UI |
| date | datetime | yes | When captured/added |

## Frontend

### Grid Layout

- CSS Grid with fixed aspect ratio cells (e.g. 4:3)
- Image constrained to cell width, centered vertically within the cell
- Leftover space filled with subtle background color (matches site bg or neutral)
- Cell sizing varies by `device_type`:
  - Mobile/watch: narrower columns
  - Desktop/TV/game: wider spans (2-column span or larger)
  - Tablet: standard width
- Responsive: fewer columns on smaller viewports

### Hover Behavior

- On mouse enter: image zooms in (e.g. 1.5-2x)
- Mouse movement pans the zoomed image relative to cursor position
- Focal point (focal_x, focal_y) is the initial center of the zoom
- Smooth transitions on enter/exit

### Focus Mode

- Toggle for desktop/TV entries in the grid
- Crops the thumbnail to the focal point area instead of showing the full image
- Useful for large screenshots where the empty state is a small portion of the screen

### Filtering

- **Primary navigation:** Device type filters (Mobile, Desktop, Tablet, TV, Watch, Game)
- **Secondary filters:** Platform pills (iOS, Android, Web, macOS, Windows) + tag pills
- Filters are combinable (e.g. Mobile + iOS + onboarding)
- URL-driven for shareability via query parameters (e.g. `?device=mobile&platform=ios&tags=onboarding`)
- Active filters clearly indicated, easy to clear

### Search

- Client-side search using a static JSON index built at build time
- Index includes: title, app_name, app_url, tags, ocr_text
- Simple word/substring matching across all indexed fields
- Search works in combination with active filters (search within filtered view)
- Search input prominently placed in the header/toolbar

### Detail Page

- Full-size image (original resolution)
- Metadata display: app name (linked if URL exists), device type, platform, tags, date
- Previous/next navigation between states
- OCR text in a collapsible section (doubles as accessibility aid)

### Style

- Utilitarian: minimal chrome, maximum content
- Dark mode support via `prefers-color-scheme`
- System font stack
- Responsive design, mobile-first

## Capture Workflow

### Mobile Upload Flow

1. Take screenshot on phone
2. Open EMDash admin in mobile browser (or PWA home screen shortcut)
3. Create new State entry
4. Upload image, type title, select device_type and platform from dropdowns, tap tags
5. Submit — image stored to R2, metadata to D1
6. Form resets for next entry (rapid-fire capture)

### Focal Point

- Defaults to center (50, 50)
- Set manually later via admin when curating

### OCR Processing

- Tesseract runs at build time over all images
- Extracts visible text from screenshots
- Stores result in `ocr_text` field in D1
- Only processes images that don't already have OCR text (incremental)

### Build Trigger

- Deploy hook fires on content submission via EMDash admin
- Cloudflare Pages rebuilds the site
- Site updates within a couple of minutes

## Thumbnails

- Generated at build time using sharp (via Astro's image pipeline)
- 3 sizes per image: small (~300px wide), medium (~600px wide), large (~1200px wide)
- Stored in R2 alongside originals
- Responsive `srcset` for optimal loading

## Migration

- Import existing 235 entries from `/content/states/` markdown frontmatter
- Parse YAML frontmatter for title, date, tags, image path
- Upload images to R2
- Insert metadata into D1 States collection
- Map existing tags to new device_type/platform/tags fields
- Run Tesseract OCR on all existing images
- Migration script as a one-time build step

## Performance Considerations

- Astro ships zero JS by default
- Interactive islands only for: search, filter controls, hover zoom
- Images lazy-loaded with responsive srcset
- Search index is a static JSON file (cached by CDN)
- Thumbnails served from R2 via Cloudflare CDN edge cache

## Out of Scope (Phase 2)

- Community submissions (user-facing upload form)
- Comments or voting
- API for external consumers
- Analytics beyond basic Cloudflare analytics
