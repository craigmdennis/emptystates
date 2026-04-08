# EmptyStates Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild emptystat.es as an EMDash-powered CMS gallery with fast mobile capture, filterable grid, client-side search, and build-time OCR.

**Architecture:** EMDash (Astro-based CMS) on Cloudflare Workers with D1 for metadata and R2 for image storage. The theme is a standard Astro project with interactive islands for search, filtering, and hover zoom. A migration script imports the existing 235 markdown entries.

**Tech Stack:** EMDash, Astro 6, Cloudflare Workers/D1/R2, Tesseract.js, TypeScript, CSS (no framework)

---

## File Structure

```
emptystates/                         # Project root (replaces Gatsby project)
├── .emdash/
│   └── seed.json                    # Content model: States collection
├── src/
│   ├── pages/
│   │   ├── index.astro              # Homepage: gallery grid with filters
│   │   ├── s/[slug].astro           # Detail page for a single state
│   │   └── search-index.json.ts     # API endpoint: generates search JSON
│   ├── layouts/
│   │   └── Base.astro               # HTML shell, nav, dark mode, meta
│   ├── components/
│   │   ├── Gallery.astro            # CSS Grid gallery wrapper
│   │   ├── GalleryCard.astro        # Single card: image + background fill
│   │   ├── FilterBar.astro          # Server-rendered filter pills
│   │   ├── FilterIsland.tsx         # Client-side filter toggle logic
│   │   ├── SearchIsland.tsx         # Client-side search input + results
│   │   ├── ZoomIsland.tsx           # Hover zoom + pan behavior
│   │   ├── DetailMeta.astro         # Metadata block on detail page
│   │   └── Pagination.astro         # Page navigation
│   └── styles/
│       ├── global.css               # CSS variables, resets, dark mode, typography
│       ├── gallery.css              # Grid layout, card aspect ratios
│       └── detail.css               # Detail page styles
├── scripts/
│   ├── migrate.ts                   # One-time migration from markdown to EMDash
│   └── ocr.ts                       # Build-time OCR with Tesseract.js
├── astro.config.mjs                 # Astro + EMDash + Cloudflare config
├── wrangler.jsonc                   # D1 + R2 bindings
├── package.json
└── tsconfig.json
```

---

### Task 1: Scaffold EMDash Project

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `wrangler.jsonc`
- Create: `tsconfig.json`

- [ ] **Step 1: Initialize the EMDash project**

Run in the project root (the existing Gatsby files will be removed in a later task):

```bash
npm create emdash@latest -- --template theme-starter emptystates-new
```

Select options:
- Package manager: npm
- Install dependencies: yes

This creates a new directory `emptystates-new/` with the EMDash scaffold.

- [ ] **Step 2: Move scaffold files to project root**

```bash
# Move key files from scaffold to project root
cp emptystates-new/astro.config.mjs ./astro.config.mjs
cp emptystates-new/tsconfig.json ./tsconfig.json
cp emptystates-new/package.json ./package.json.new
cp -r emptystates-new/.emdash ./.emdash
cp -r emptystates-new/src ./src-new
```

Manually merge `package.json.new` into the project's `package.json`, keeping the project name as `emptystates` and the repository URL. Then remove `emptystates-new/`.

- [ ] **Step 3: Configure astro.config.mjs for Cloudflare**

```js
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import emdash from "emdash/astro";
import { d1, r2 } from "@emdash-cms/cloudflare";

export default defineConfig({
  output: "server",
  adapter: cloudflare(),
  integrations: [
    emdash({
      database: d1({ binding: "DB" }),
      storage: r2({ binding: "MEDIA" }),
    }),
  ],
});
```

- [ ] **Step 4: Configure wrangler.jsonc**

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "emptystates",
  "compatibility_date": "2025-01-15",
  "compatibility_flags": ["nodejs_compat"],

  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "emptystates-db",
      "database_id": "PLACEHOLDER_AFTER_CREATION"
    }
  ],

  "r2_buckets": [
    {
      "binding": "MEDIA",
      "bucket_name": "emptystates-media"
    }
  ]
}
```

- [ ] **Step 5: Verify local dev server starts**

```bash
npm run dev
```

Expected: Astro dev server runs at `http://localhost:4321`. EMDash admin accessible at `http://localhost:4321/_emdash/admin`.

- [ ] **Step 6: Commit**

```bash
git add astro.config.mjs wrangler.jsonc tsconfig.json package.json package-lock.json .emdash/ src/
git commit -m "feat: scaffold EMDash project with Cloudflare config"
```

---

### Task 2: Define Content Model (seed.json)

**Files:**
- Create: `.emdash/seed.json`

- [ ] **Step 1: Write the seed.json with States collection**

```json
{
  "$schema": "https://emdashcms.com/seed.schema.json",
  "version": "1",
  "collections": [
    {
      "slug": "states",
      "label": "Empty States",
      "labelSingular": "Empty State",
      "description": "Curated empty state UI screenshots",
      "icon": "image",
      "supports": ["drafts"],
      "fields": [
        {
          "slug": "title",
          "label": "Title",
          "type": "string",
          "required": true,
          "validation": { "maxLength": 200 }
        },
        {
          "slug": "slug",
          "label": "URL Slug",
          "type": "slug",
          "required": true,
          "unique": true
        },
        {
          "slug": "screenshot",
          "label": "Screenshot",
          "type": "image",
          "required": true
        },
        {
          "slug": "app_name",
          "label": "App Name",
          "type": "string"
        },
        {
          "slug": "app_url",
          "label": "App URL",
          "type": "string"
        },
        {
          "slug": "device_type",
          "label": "Device Type",
          "type": "select",
          "required": true,
          "validation": {
            "options": ["mobile", "tablet", "desktop", "tv", "watch", "game"]
          }
        },
        {
          "slug": "platform",
          "label": "Platform",
          "type": "select",
          "validation": {
            "options": ["ios", "android", "web", "macos", "windows"]
          }
        },
        {
          "slug": "tags",
          "label": "Tags",
          "type": "multiSelect",
          "validation": {
            "options": [
              "onboarding",
              "error",
              "no-results",
              "no-content",
              "first-run",
              "permissions",
              "location",
              "illustration",
              "text-only",
              "success",
              "upgrade",
              "connection",
              "search",
              "notification",
              "empty-cart",
              "empty-inbox"
            ]
          }
        },
        {
          "slug": "focal_x",
          "label": "Focal Point X (%)",
          "type": "integer",
          "defaultValue": 50,
          "validation": { "min": 0, "max": 100 }
        },
        {
          "slug": "focal_y",
          "label": "Focal Point Y (%)",
          "type": "integer",
          "defaultValue": 50,
          "validation": { "min": 0, "max": 100 }
        },
        {
          "slug": "ocr_text",
          "label": "OCR Text",
          "type": "text"
        },
        {
          "slug": "captured_at",
          "label": "Captured At",
          "type": "datetime"
        }
      ]
    }
  ]
}
```

- [ ] **Step 2: Seed the database locally**

```bash
npx emdash seed
```

Expected: Collection "states" created in local SQLite with all fields.

- [ ] **Step 3: Verify in admin UI**

Run `npm run dev`, navigate to `http://localhost:4321/_emdash/admin`. Confirm the "Empty States" collection appears with all fields in the create form.

- [ ] **Step 4: Commit**

```bash
git add .emdash/seed.json
git commit -m "feat: define States content model in seed.json"
```

---

### Task 3: Base Layout and Global Styles

**Files:**
- Create: `src/layouts/Base.astro`
- Create: `src/styles/global.css`

- [ ] **Step 1: Create global.css with CSS variables, resets, and dark mode**

```css
/* src/styles/global.css */

:root {
  --color-bg: #ffffff;
  --color-bg-subtle: #f5f5f5;
  --color-text: #1a1a1a;
  --color-text-muted: #666666;
  --color-border: #e0e0e0;
  --color-accent: #0066cc;
  --color-card-bg: #f0f0f0;

  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  --font-mono: "SF Mono", SFMono-Regular, Consolas, "Liberation Mono",
    Menlo, Courier, monospace;

  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 2rem;
  --space-xl: 4rem;

  --max-width: 1400px;
  --radius: 4px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #111111;
    --color-bg-subtle: #1a1a1a;
    --color-text: #e0e0e0;
    --color-text-muted: #999999;
    --color-border: #333333;
    --color-accent: #4d9fff;
    --color-card-bg: #1e1e1e;
  }
}

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
}

html {
  font-family: var(--font-sans);
  color: var(--color-text);
  background: var(--color-bg);
  -webkit-font-smoothing: antialiased;
}

body {
  min-height: 100dvh;
}

img {
  display: block;
  max-width: 100%;
  height: auto;
}

a {
  color: var(--color-accent);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}
```

- [ ] **Step 2: Create Base.astro layout**

```astro
---
// src/layouts/Base.astro
import "../styles/global.css";

interface Props {
  title: string;
  description?: string;
  image?: string;
}

const {
  title,
  description = "A curated gallery of empty state UI designs",
  image,
} = Astro.props;

const siteTitle = "Empty States";
const fullTitle = title === siteTitle ? title : `${title} — ${siteTitle}`;
const canonicalUrl = new URL(Astro.url.pathname, Astro.site ?? "https://emptystat.es");
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{fullTitle}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonicalUrl} />

    <meta property="og:title" content={fullTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={canonicalUrl} />
    {image && <meta property="og:image" content={image} />}

    <meta name="twitter:card" content="summary_large_image" />
  </head>
  <body>
    <header class="site-header">
      <div class="site-header-inner">
        <a href="/" class="site-logo">{siteTitle}</a>
        <nav class="site-nav" aria-label="Device filters">
          <a href="/?device=mobile">Mobile</a>
          <a href="/?device=desktop">Desktop</a>
          <a href="/?device=tablet">Tablet</a>
          <a href="/?device=tv">TV</a>
          <a href="/?device=watch">Watch</a>
          <a href="/?device=game">Game</a>
        </nav>
      </div>
    </header>

    <main>
      <slot />
    </main>

    <footer class="site-footer">
      <p>A curated collection of empty state designs.</p>
    </footer>
  </body>
</html>

<style>
  .site-header {
    border-bottom: 1px solid var(--color-border);
    padding: var(--space-md);
  }

  .site-header-inner {
    max-width: var(--max-width);
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
    flex-wrap: wrap;
  }

  .site-logo {
    font-weight: 700;
    font-size: 1.125rem;
    color: var(--color-text);
    text-decoration: none;
  }

  .site-nav {
    display: flex;
    gap: var(--space-sm);
    flex-wrap: wrap;
  }

  .site-nav a {
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius);
    font-size: 0.875rem;
    color: var(--color-text-muted);
    text-decoration: none;
  }

  .site-nav a:hover {
    background: var(--color-bg-subtle);
    color: var(--color-text);
    text-decoration: none;
  }

  .site-footer {
    border-top: 1px solid var(--color-border);
    padding: var(--space-lg) var(--space-md);
    text-align: center;
    color: var(--color-text-muted);
    font-size: 0.875rem;
  }

  main {
    max-width: var(--max-width);
    margin: 0 auto;
    padding: var(--space-md);
  }
</style>
```

- [ ] **Step 3: Verify layout renders**

Run `npm run dev`. Visit `http://localhost:4321`. Confirm header with nav links, footer, and dark mode switching work.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/Base.astro src/styles/global.css
git commit -m "feat: add Base layout with global styles and dark mode"
```

---

### Task 4: Gallery Grid and Card Components

**Files:**
- Create: `src/components/Gallery.astro`
- Create: `src/components/GalleryCard.astro`
- Create: `src/styles/gallery.css`

- [ ] **Step 1: Create gallery.css**

```css
/* src/styles/gallery.css */

.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-md);
}

/* Cards for wide content (desktop, tv, game) span 2 columns */
.gallery-card--wide {
  grid-column: span 2;
}

@media (max-width: 640px) {
  .gallery {
    grid-template-columns: 1fr;
  }

  .gallery-card--wide {
    grid-column: span 1;
  }
}

.gallery-card {
  position: relative;
  aspect-ratio: 4 / 3;
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--color-card-bg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.gallery-card a {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.gallery-card img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
}

.gallery-card-title {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--space-sm) var(--space-md);
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  color: #fff;
  font-size: 0.8125rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.gallery-card:hover .gallery-card-title {
  opacity: 1;
}
```

- [ ] **Step 2: Create GalleryCard.astro**

```astro
---
// src/components/GalleryCard.astro
interface Props {
  slug: string;
  title: string;
  image: { url: string; alt?: string; width?: number; height?: number };
  deviceType: string;
}

const { slug, title, image, deviceType } = Astro.props;

const isWide = ["desktop", "tv", "game"].includes(deviceType);
---

<div class:list={["gallery-card", { "gallery-card--wide": isWide }]}>
  <a href={`/s/${slug}/`}>
    <img
      src={image.url}
      alt={image.alt || title}
      width={image.width}
      height={image.height}
      loading="lazy"
      decoding="async"
    />
    <span class="gallery-card-title">{title}</span>
  </a>
</div>
```

- [ ] **Step 3: Create Gallery.astro**

```astro
---
// src/components/Gallery.astro
import "../styles/gallery.css";

interface Props {
  class?: string;
}
---

<div class:list={["gallery", Astro.props.class]}>
  <slot />
</div>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Gallery.astro src/components/GalleryCard.astro src/styles/gallery.css
git commit -m "feat: add Gallery grid and GalleryCard components"
```

---

### Task 5: Homepage — Gallery with Pagination

**Files:**
- Create: `src/pages/index.astro`
- Create: `src/components/Pagination.astro`

- [ ] **Step 1: Create Pagination.astro**

```astro
---
// src/components/Pagination.astro
interface Props {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

const { currentPage, totalPages, baseUrl } = Astro.props;

function pageUrl(page: number): string {
  const url = new URL(baseUrl, "https://emptystat.es");
  if (page > 1) url.searchParams.set("page", String(page));
  return url.pathname + url.search;
}
---

{totalPages > 1 && (
  <nav class="pagination" aria-label="Page navigation">
    {currentPage > 1 && (
      <a href={pageUrl(currentPage - 1)} class="pagination-link">Previous</a>
    )}
    <span class="pagination-info">
      Page {currentPage} of {totalPages}
    </span>
    {currentPage < totalPages && (
      <a href={pageUrl(currentPage + 1)} class="pagination-link">Next</a>
    )}
  </nav>
)}

<style>
  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-md);
    padding: var(--space-lg) 0;
  }

  .pagination-link {
    padding: var(--space-xs) var(--space-md);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    font-size: 0.875rem;
  }

  .pagination-info {
    font-size: 0.875rem;
    color: var(--color-text-muted);
  }
</style>
```

- [ ] **Step 2: Create index.astro homepage**

```astro
---
// src/pages/index.astro
import Layout from "../layouts/Base.astro";
import Gallery from "../components/Gallery.astro";
import GalleryCard from "../components/GalleryCard.astro";
import Pagination from "../components/Pagination.astro";
import { getEmDashCollection } from "emdash:content";

const ITEMS_PER_PAGE = 60;

const url = Astro.url;
const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
const deviceFilter = url.searchParams.get("device");
const platformFilter = url.searchParams.get("platform");

const where: Record<string, string> = { status: "published" };
if (deviceFilter) where.device_type = deviceFilter;
if (platformFilter) where.platform = platformFilter;

const { entries: allEntries } = await getEmDashCollection("states", {
  where,
  limit: ITEMS_PER_PAGE + 1,
});

// Simple offset pagination: fetch limit+1 to know if there's a next page
const hasNextPage = allEntries.length > ITEMS_PER_PAGE;
const entries = allEntries.slice(0, ITEMS_PER_PAGE);

const title = deviceFilter
  ? `${deviceFilter.charAt(0).toUpperCase() + deviceFilter.slice(1)} Empty States`
  : "Empty States";
---

<Layout title={title}>
  <Gallery>
    {entries.map((entry) => (
      <GalleryCard
        slug={entry.data.slug}
        title={entry.data.title}
        image={entry.data.screenshot}
        deviceType={entry.data.device_type}
      />
    ))}
  </Gallery>

  <Pagination
    currentPage={page}
    totalPages={hasNextPage ? page + 1 : page}
    baseUrl={url.pathname + url.search}
  />
</Layout>
```

**Note:** The `getEmDashCollection` API may need adjustment based on actual pagination support. If it supports `offset`, use `offset: (page - 1) * ITEMS_PER_PAGE` instead of the limit+1 approach. Consult the EMDash docs at runtime.

- [ ] **Step 3: Verify homepage loads with gallery grid**

Run `npm run dev`. Visit `http://localhost:4321`. If content has been seeded, cards should appear. Otherwise, add a test entry via the admin at `/_emdash/admin` first.

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro src/components/Pagination.astro
git commit -m "feat: add homepage with paginated gallery grid"
```

---

### Task 6: Detail Page

**Files:**
- Create: `src/pages/s/[slug].astro`
- Create: `src/components/DetailMeta.astro`
- Create: `src/styles/detail.css`

- [ ] **Step 1: Create detail.css**

```css
/* src/styles/detail.css */

.detail {
  max-width: 900px;
  margin: 0 auto;
}

.detail-image {
  margin-bottom: var(--space-lg);
  background: var(--color-card-bg);
  border-radius: var(--radius);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-md);
}

.detail-image img {
  max-width: 100%;
  height: auto;
}

.detail-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: var(--space-md);
}

.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.detail-meta-tag {
  padding: var(--space-xs) var(--space-sm);
  background: var(--color-bg-subtle);
  border-radius: var(--radius);
  font-size: 0.75rem;
}

.detail-ocr {
  margin-top: var(--space-lg);
  border-top: 1px solid var(--color-border);
  padding-top: var(--space-md);
}

.detail-ocr summary {
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.detail-ocr pre {
  margin-top: var(--space-sm);
  font-size: 0.8125rem;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--color-text-muted);
}

.detail-nav {
  display: flex;
  justify-content: space-between;
  padding: var(--space-lg) 0;
  border-top: 1px solid var(--color-border);
  margin-top: var(--space-lg);
  font-size: 0.875rem;
}
```

- [ ] **Step 2: Create DetailMeta.astro**

```astro
---
// src/components/DetailMeta.astro
interface Props {
  appName?: string;
  appUrl?: string;
  deviceType: string;
  platform?: string;
  tags?: string[];
  capturedAt?: string;
}

const { appName, appUrl, deviceType, platform, tags, capturedAt } = Astro.props;

const formattedDate = capturedAt
  ? new Date(capturedAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  : null;
---

<div class="detail-meta">
  {appName && (
    <span>
      {appUrl ? <a href={appUrl}>{appName}</a> : appName}
    </span>
  )}
  <span class="detail-meta-tag">{deviceType}</span>
  {platform && <span class="detail-meta-tag">{platform}</span>}
  {tags?.map((tag) => <span class="detail-meta-tag">{tag}</span>)}
  {formattedDate && <span>{formattedDate}</span>}
</div>
```

- [ ] **Step 3: Create the detail page s/[slug].astro**

```astro
---
// src/pages/s/[slug].astro
import Layout from "../../layouts/Base.astro";
import DetailMeta from "../../components/DetailMeta.astro";
import "../../styles/detail.css";
import { getEmDashEntry } from "emdash:content";

const { slug } = Astro.params;
const { entry } = await getEmDashEntry("states", slug!);

if (!entry) {
  return Astro.redirect("/404");
}

const d = entry.data;
---

<Layout title={d.title} image={d.screenshot?.url}>
  <article class="detail">
    <h1 class="detail-title">{d.title}</h1>

    <DetailMeta
      appName={d.app_name}
      appUrl={d.app_url}
      deviceType={d.device_type}
      platform={d.platform}
      tags={d.tags}
      capturedAt={d.captured_at}
    />

    <div class="detail-image">
      <img
        src={d.screenshot.url}
        alt={d.screenshot.alt || d.title}
        width={d.screenshot.width}
        height={d.screenshot.height}
      />
    </div>

    {d.ocr_text && (
      <details class="detail-ocr">
        <summary>Extracted text from screenshot</summary>
        <pre>{d.ocr_text}</pre>
      </details>
    )}
  </article>
</Layout>
```

- [ ] **Step 4: Verify detail page renders**

Run `npm run dev`. Create a test entry via admin if needed. Navigate to its detail URL (`/s/<slug>/`). Confirm image, metadata, and OCR section render correctly.

- [ ] **Step 5: Commit**

```bash
git add src/pages/s/ src/components/DetailMeta.astro src/styles/detail.css
git commit -m "feat: add detail page for individual states"
```

---

### Task 7: Filter Bar (Server-Rendered)

**Files:**
- Create: `src/components/FilterBar.astro`

- [ ] **Step 1: Create FilterBar.astro**

```astro
---
// src/components/FilterBar.astro
interface Props {
  activeDevice?: string;
  activePlatform?: string;
  activeTags?: string[];
}

const { activeDevice, activePlatform, activeTags = [] } = Astro.props;

const platforms = ["ios", "android", "web", "macos", "windows"];
const tags = [
  "onboarding", "error", "no-results", "no-content", "first-run",
  "permissions", "location", "illustration", "text-only", "success",
  "upgrade", "connection", "search", "notification", "empty-cart", "empty-inbox",
];

function buildUrl(params: Record<string, string | string[] | undefined>): string {
  const url = new URL("/", "https://emptystat.es");
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => url.searchParams.append(key, v));
    } else {
      url.searchParams.set(key, value);
    }
  }
  return url.pathname + url.search;
}

function toggleTag(tag: string): string {
  const newTags = activeTags.includes(tag)
    ? activeTags.filter((t) => t !== tag)
    : [...activeTags, tag];
  return buildUrl({
    device: activeDevice,
    platform: activePlatform,
    tags: newTags.length ? newTags : undefined,
  });
}

function togglePlatform(p: string): string {
  return buildUrl({
    device: activeDevice,
    platform: activePlatform === p ? undefined : p,
    tags: activeTags.length ? activeTags : undefined,
  });
}
---

<div class="filter-bar">
  <div class="filter-group">
    <span class="filter-label">Platform</span>
    <div class="filter-pills">
      {platforms.map((p) => (
        <a
          href={togglePlatform(p)}
          class:list={["filter-pill", { "filter-pill--active": activePlatform === p }]}
        >
          {p}
        </a>
      ))}
    </div>
  </div>

  <div class="filter-group">
    <span class="filter-label">Tags</span>
    <div class="filter-pills">
      {tags.map((tag) => (
        <a
          href={toggleTag(tag)}
          class:list={["filter-pill", { "filter-pill--active": activeTags.includes(tag) }]}
        >
          {tag}
        </a>
      ))}
    </div>
  </div>

  {(activeDevice || activePlatform || activeTags.length > 0) && (
    <a href="/" class="filter-clear">Clear all filters</a>
  )}
</div>

<style>
  .filter-bar {
    margin-bottom: var(--space-lg);
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .filter-group {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    flex-wrap: wrap;
  }

  .filter-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    min-width: 5rem;
  }

  .filter-pills {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  .filter-pill {
    padding: var(--space-xs) var(--space-sm);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    font-size: 0.75rem;
    color: var(--color-text-muted);
    text-decoration: none;
    transition: all 0.15s ease;
  }

  .filter-pill:hover {
    border-color: var(--color-text);
    color: var(--color-text);
    text-decoration: none;
  }

  .filter-pill--active {
    background: var(--color-text);
    color: var(--color-bg);
    border-color: var(--color-text);
  }

  .filter-clear {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }
</style>
```

- [ ] **Step 2: Wire FilterBar into index.astro**

Add to the top of `src/pages/index.astro`, before the `<Gallery>` component:

```astro
---
// Add to existing frontmatter imports
import FilterBar from "../components/FilterBar.astro";

// Add to existing URL param parsing
const tagsFilter = url.searchParams.getAll("tags");
---

<!-- Add before <Gallery> in the template -->
<FilterBar
  activeDevice={deviceFilter}
  activePlatform={platformFilter}
  activeTags={tagsFilter}
/>
```

- [ ] **Step 3: Verify filters work**

Run `npm run dev`. Click platform and tag pills. Confirm URL updates, pills toggle active state, and gallery filters accordingly.

- [ ] **Step 4: Commit**

```bash
git add src/components/FilterBar.astro src/pages/index.astro
git commit -m "feat: add server-rendered filter bar with platform and tag pills"
```

---

### Task 8: Client-Side Search Island

**Files:**
- Create: `src/pages/search-index.json.ts`
- Create: `src/components/SearchIsland.tsx`

- [ ] **Step 1: Create the search index API endpoint**

```ts
// src/pages/search-index.json.ts
import type { APIRoute } from "astro";
import { getEmDashCollection } from "emdash:content";

export const GET: APIRoute = async () => {
  const { entries } = await getEmDashCollection("states", {
    where: { status: "published" },
  });

  const index = entries.map((entry) => ({
    slug: entry.data.slug,
    title: entry.data.title,
    app_name: entry.data.app_name ?? "",
    app_url: entry.data.app_url ?? "",
    device_type: entry.data.device_type,
    platform: entry.data.platform ?? "",
    tags: (entry.data.tags ?? []).join(" "),
    ocr_text: entry.data.ocr_text ?? "",
    image_url: entry.data.screenshot?.url ?? "",
  }));

  return new Response(JSON.stringify(index), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
```

- [ ] **Step 2: Create SearchIsland.tsx**

```tsx
// src/components/SearchIsland.tsx
import { useState, useEffect, useRef } from "react";

interface SearchEntry {
  slug: string;
  title: string;
  app_name: string;
  app_url: string;
  device_type: string;
  platform: string;
  tags: string;
  ocr_text: string;
  image_url: string;
}

export default function SearchIsland() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchEntry[]>([]);
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.length < 2 || index) return;
    fetch("/search-index.json")
      .then((r) => r.json())
      .then((data) => setIndex(data));
  }, [query, index]);

  useEffect(() => {
    if (!index || query.length < 2) {
      setResults([]);
      return;
    }

    const terms = query.toLowerCase().split(/\s+/);
    const matched = index.filter((entry) => {
      const haystack = [
        entry.title,
        entry.app_name,
        entry.app_url,
        entry.device_type,
        entry.platform,
        entry.tags,
        entry.ocr_text,
      ]
        .join(" ")
        .toLowerCase();

      return terms.every((term) => haystack.includes(term));
    });

    setResults(matched.slice(0, 20));
  }, [query, index]);

  return (
    <div className="search-island">
      <input
        ref={inputRef}
        type="search"
        placeholder="Search states..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => query.length >= 2 && setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        aria-label="Search empty states"
      />
      {isOpen && results.length > 0 && (
        <ul className="search-results">
          {results.map((r) => (
            <li key={r.slug}>
              <a href={`/s/${r.slug}/`}>
                <img src={r.image_url} alt="" width={48} height={36} loading="lazy" />
                <span>
                  <strong>{r.title}</strong>
                  {r.app_name && <small>{r.app_name}</small>}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add SearchIsland to Base.astro header**

Add React to the project:
```bash
npx astro add react
```

Then update `src/layouts/Base.astro` header:

```astro
---
// Add to imports
import SearchIsland from "../components/SearchIsland.tsx";
---

<!-- Add inside .site-header-inner, between logo and nav -->
<SearchIsland client:idle />
```

- [ ] **Step 4: Add search styles to global.css**

Append to `src/styles/global.css`:

```css
.search-island {
  position: relative;
  flex: 1;
  max-width: 320px;
}

.search-island input {
  width: 100%;
  padding: var(--space-xs) var(--space-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.875rem;
  font-family: inherit;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  margin-top: 2px;
  max-height: 400px;
  overflow-y: auto;
  list-style: none;
  padding: 0;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.search-results li a {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm);
  text-decoration: none;
  color: var(--color-text);
}

.search-results li a:hover {
  background: var(--color-bg-subtle);
}

.search-results img {
  border-radius: 2px;
  object-fit: cover;
  flex-shrink: 0;
}

.search-results small {
  display: block;
  color: var(--color-text-muted);
  font-size: 0.75rem;
}
```

- [ ] **Step 5: Verify search works**

Run `npm run dev`. Type in the search box. Confirm dropdown appears with matching results after 2+ characters.

- [ ] **Step 6: Commit**

```bash
git add src/pages/search-index.json.ts src/components/SearchIsland.tsx src/layouts/Base.astro src/styles/global.css
git commit -m "feat: add client-side search with JSON index"
```

---

### Task 9: Hover Zoom Island

**Files:**
- Create: `src/components/ZoomIsland.tsx`

- [ ] **Step 1: Create ZoomIsland.tsx**

```tsx
// src/components/ZoomIsland.tsx
import { useRef, useCallback } from "react";

interface Props {
  src: string;
  alt: string;
  focalX?: number;
  focalY?: number;
}

const ZOOM_SCALE = 2;

export default function ZoomIsland({ src, alt, focalX = 50, focalY = 50 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      const img = imgRef.current;
      if (!container || !img) return;

      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      img.style.transformOrigin = `${x}% ${y}%`;
    },
    []
  );

  const handleMouseEnter = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    img.style.transformOrigin = `${focalX}% ${focalY}%`;
    img.style.transform = `scale(${ZOOM_SCALE})`;
    img.style.transition = "transform 0.3s ease";
  }, [focalX, focalY]);

  const handleMouseLeave = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    img.style.transform = "scale(1)";
  }, []);

  return (
    <div
      ref={containerRef}
      className="zoom-container"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <img ref={imgRef} src={src} alt={alt} loading="lazy" decoding="async" />
    </div>
  );
}
```

- [ ] **Step 2: Add zoom styles to gallery.css**

Append to `src/styles/gallery.css`:

```css
.zoom-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-in;
}

.zoom-container img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  transition: transform 0.3s ease;
  will-change: transform;
}
```

- [ ] **Step 3: Integrate ZoomIsland into GalleryCard.astro**

Update `src/components/GalleryCard.astro` to use ZoomIsland:

```astro
---
// src/components/GalleryCard.astro
import ZoomIsland from "./ZoomIsland.tsx";

interface Props {
  slug: string;
  title: string;
  image: { url: string; alt?: string; width?: number; height?: number };
  deviceType: string;
  focalX?: number;
  focalY?: number;
}

const { slug, title, image, deviceType, focalX = 50, focalY = 50 } = Astro.props;

const isWide = ["desktop", "tv", "game"].includes(deviceType);
---

<div class:list={["gallery-card", { "gallery-card--wide": isWide }]}>
  <a href={`/s/${slug}/`}>
    <ZoomIsland
      client:visible
      src={image.url}
      alt={image.alt || title}
      focalX={focalX}
      focalY={focalY}
    />
    <span class="gallery-card-title">{title}</span>
  </a>
</div>
```

- [ ] **Step 4: Update index.astro to pass focal point props**

In `src/pages/index.astro`, update the GalleryCard usage:

```astro
<GalleryCard
  slug={entry.data.slug}
  title={entry.data.title}
  image={entry.data.screenshot}
  deviceType={entry.data.device_type}
  focalX={entry.data.focal_x}
  focalY={entry.data.focal_y}
/>
```

- [ ] **Step 5: Verify hover zoom works**

Run `npm run dev`. Hover over gallery cards. Confirm zoom activates, mouse movement pans the zoomed image, and it resets on mouse leave.

- [ ] **Step 6: Commit**

```bash
git add src/components/ZoomIsland.tsx src/components/GalleryCard.astro src/pages/index.astro src/styles/gallery.css
git commit -m "feat: add hover zoom with focal point panning"
```

---

### Task 10: Build-Time OCR Script

**Files:**
- Create: `scripts/ocr.ts`
- Modify: `package.json` (add script)

- [ ] **Step 1: Install Tesseract.js**

```bash
npm install tesseract.js
```

- [ ] **Step 2: Create scripts/ocr.ts**

```ts
// scripts/ocr.ts
import Tesseract from "tesseract.js";

/**
 * Build-time OCR script.
 * Fetches all states from the local EMDash API, runs Tesseract on images
 * that don't have ocr_text, and updates them via the REST API.
 *
 * Run: npm run ocr
 * Requires the dev server to be running.
 */

const API_BASE = "http://localhost:4321/_emdash/api";

interface State {
  id: string;
  data: {
    slug: string;
    title: string;
    ocr_text?: string;
    screenshot?: { url: string };
  };
}

async function fetchStates(): Promise<State[]> {
  const res = await fetch(`${API_BASE}/collections/states/entries`);
  if (!res.ok) throw new Error(`Failed to fetch states: ${res.status}`);
  const json = await res.json();
  return json.entries ?? json;
}

async function updateOcrText(id: string, ocrText: string): Promise<void> {
  const res = await fetch(`${API_BASE}/collections/states/entries/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ocr_text: ocrText }),
  });
  if (!res.ok) throw new Error(`Failed to update ${id}: ${res.status}`);
}

async function runOcr(imageUrl: string): Promise<string> {
  const { data } = await Tesseract.recognize(imageUrl, "eng");
  return data.text.trim();
}

async function main() {
  console.log("Fetching states...");
  const states = await fetchStates();
  const needsOcr = states.filter(
    (s) => s.data.screenshot?.url && !s.data.ocr_text
  );

  console.log(`${needsOcr.length} of ${states.length} states need OCR.`);

  for (const state of needsOcr) {
    const url = state.data.screenshot!.url;
    console.log(`OCR: ${state.data.title}...`);
    try {
      const text = await runOcr(url);
      if (text) {
        await updateOcrText(state.id, text);
        console.log(`  -> ${text.length} chars extracted`);
      } else {
        console.log(`  -> no text found`);
      }
    } catch (err) {
      console.error(`  -> FAILED: ${err}`);
    }
  }

  console.log("Done.");
}

main();
```

**Note:** The EMDash REST API paths may differ. Check `/_emdash/api` routes at runtime. The script assumes the dev server is running so it can access images and the API. Adjust endpoint paths as needed.

- [ ] **Step 3: Add npm script**

Add to `package.json` scripts:

```json
{
  "scripts": {
    "ocr": "npx tsx scripts/ocr.ts"
  }
}
```

- [ ] **Step 4: Test OCR on a single entry**

Start the dev server, create a test entry with an image, then run:

```bash
npm run ocr
```

Expected: Script fetches states, runs Tesseract on the image, and updates the ocr_text field.

- [ ] **Step 5: Commit**

```bash
git add scripts/ocr.ts package.json
git commit -m "feat: add build-time OCR script using Tesseract.js"
```

---

### Task 11: Migration Script

**Files:**
- Create: `scripts/migrate.ts`

- [ ] **Step 1: Install dependencies**

```bash
npm install gray-matter glob tsx
```

- [ ] **Step 2: Create scripts/migrate.ts**

```ts
// scripts/migrate.ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { glob } from "glob";

/**
 * Migrates existing markdown content from /content/states/ to EMDash
 * via the REST API. Requires the dev server to be running.
 *
 * Run: npm run migrate
 */

const API_BASE = "http://localhost:4321/_emdash/api";
const CONTENT_DIR = path.resolve("content/states");

interface FrontMatter {
  title: string;
  date: string;
  image: string;
  tags?: string[];
  referral?: string;
}

// Map old tags to device_type, platform, and new tags
function classifyTags(oldTags: string[]): {
  device_type: string;
  platform?: string;
  tags: string[];
} {
  const lower = oldTags.map((t) => t.toLowerCase());

  let device_type = "mobile"; // default
  if (lower.includes("desktop")) device_type = "desktop";
  else if (lower.includes("tablet")) device_type = "tablet";
  else if (lower.includes("tv")) device_type = "tv";
  else if (lower.includes("watch")) device_type = "watch";
  else if (lower.includes("game")) device_type = "game";

  let platform: string | undefined;
  if (lower.includes("ios")) platform = "ios";
  else if (lower.includes("android")) platform = "android";
  else if (lower.includes("macos")) platform = "macos";
  else if (lower.includes("windows")) platform = "windows";
  else if (lower.includes("web")) platform = "web";

  const devicePlatformTags = [
    "mobile", "desktop", "tablet", "tv", "watch", "game",
    "ios", "android", "macos", "windows", "web",
  ];

  const validTags = [
    "onboarding", "error", "no-results", "no-content", "first-run",
    "permissions", "location", "illustration", "text-only", "success",
    "upgrade", "connection", "search", "notification", "empty-cart", "empty-inbox",
  ];

  const tags = lower.filter(
    (t) => !devicePlatformTags.includes(t) && validTags.includes(t)
  );

  return { device_type, platform, tags };
}

function slugFromDir(dirName: string): string {
  return dirName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function uploadImage(imagePath: string): Promise<{ id: string; url: string } | null> {
  if (!fs.existsSync(imagePath)) {
    console.warn(`  Image not found: ${imagePath}`);
    return null;
  }

  const formData = new FormData();
  const fileBuffer = fs.readFileSync(imagePath);
  const fileName = path.basename(imagePath);
  const blob = new Blob([fileBuffer]);
  formData.append("file", blob, fileName);

  const res = await fetch(`${API_BASE}/media`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    console.warn(`  Image upload failed: ${res.status}`);
    return null;
  }

  return res.json();
}

async function createEntry(data: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${API_BASE}/collections/states/entries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create entry failed (${res.status}): ${text}`);
  }
}

async function main() {
  const mdFiles = await glob("*/index.md", { cwd: CONTENT_DIR });
  console.log(`Found ${mdFiles.length} entries to migrate.`);

  let success = 0;
  let failed = 0;

  for (const relPath of mdFiles) {
    const fullPath = path.join(CONTENT_DIR, relPath);
    const dirName = path.dirname(relPath);
    const raw = fs.readFileSync(fullPath, "utf-8");
    const { data: fm } = matter(raw) as { data: FrontMatter };

    console.log(`Migrating: ${fm.title || dirName}`);

    const slug = slugFromDir(dirName);
    const { device_type, platform, tags } = classifyTags(fm.tags ?? []);

    // Upload image
    const imageName = fm.image?.replace("./", "");
    let screenshot = null;
    if (imageName) {
      const imagePath = path.join(CONTENT_DIR, dirName, imageName);
      screenshot = await uploadImage(imagePath);
    }

    if (!screenshot) {
      console.warn(`  Skipping (no image): ${dirName}`);
      failed++;
      continue;
    }

    try {
      await createEntry({
        title: fm.title || dirName,
        slug,
        screenshot,
        device_type,
        platform,
        tags,
        app_url: fm.referral,
        captured_at: fm.date || new Date().toISOString(),
        focal_x: 50,
        focal_y: 50,
        status: "published",
      });
      success++;
    } catch (err) {
      console.error(`  FAILED: ${err}`);
      failed++;
    }
  }

  console.log(`\nMigration complete: ${success} succeeded, ${failed} failed.`);
}

main();
```

**Note:** The EMDash REST API paths for media upload and entry creation may differ. Check the actual API routes at `/_emdash/api` when the dev server is running. Adjust `uploadImage` and `createEntry` accordingly.

- [ ] **Step 3: Add npm script**

Add to `package.json` scripts:

```json
{
  "scripts": {
    "migrate": "npx tsx scripts/migrate.ts"
  }
}
```

- [ ] **Step 4: Test migration with a small batch**

Start the dev server, then run:

```bash
npm run migrate
```

Expected: Entries created in EMDash with images uploaded. Verify via admin UI at `/_emdash/admin`.

- [ ] **Step 5: Commit**

```bash
git add scripts/migrate.ts package.json
git commit -m "feat: add migration script from markdown to EMDash"
```

---

### Task 12: Cloudflare Deployment Setup

**Files:**
- Modify: `wrangler.jsonc`

- [ ] **Step 1: Create D1 database**

```bash
wrangler d1 create emptystates-db
```

Copy the `database_id` from the output.

- [ ] **Step 2: Create R2 bucket**

```bash
wrangler r2 bucket create emptystates-media
```

- [ ] **Step 3: Update wrangler.jsonc with real database_id**

Replace `PLACEHOLDER_AFTER_CREATION` with the actual database_id from step 1.

- [ ] **Step 4: Set auth secrets**

```bash
npx emdash auth secret
wrangler secret put EMDASH_AUTH_SECRET
wrangler secret put EMDASH_PREVIEW_SECRET
```

- [ ] **Step 5: Deploy**

```bash
npm run build
wrangler deploy
```

Expected: Site live at `https://emptystates.<subdomain>.workers.dev`

- [ ] **Step 6: Verify admin and site work in production**

Visit the deployed URL. Confirm gallery loads. Visit `/_emdash/admin`. Confirm you can log in, create entries, and upload images.

- [ ] **Step 7: Commit any config changes**

```bash
git add wrangler.jsonc
git commit -m "feat: configure Cloudflare D1 and R2 for production"
```

---

### Task 13: Clean Up Old Gatsby Files

**Files:**
- Remove: `gatsby-config.js`, `gatsby-node.js`, `gatsby-browser.js`, `gatsby-ssr.js`
- Remove: `postcss.config.js`
- Remove: old `src/` directory (replaced by new src/)
- Keep: `content/states/` (needed for migration reference)

- [ ] **Step 1: Remove old Gatsby config and source files**

```bash
git rm gatsby-config.js gatsby-node.js gatsby-browser.js gatsby-ssr.js
git rm postcss.config.js
git rm .eslintrc.json .prettierrc
git rm -r src/components/ src/templates/ src/pages/ src/styles/ src/images/ src/utils/
```

**Important:** Only remove files that have been replaced. The `content/states/` directory should be kept until migration is confirmed complete.

- [ ] **Step 2: Update .gitignore**

Add Astro/Wrangler specific ignores:

```
dist/
.wrangler/
.astro/
node_modules/
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove old Gatsby files"
```

---

### Task 14: Run Migration and OCR on Production Data

This task is performed after deployment (Task 12) and connects to the production environment.

- [ ] **Step 1: Run migration against local dev server**

```bash
npm run dev &
npm run migrate
```

Verify all 235 entries imported correctly via the admin UI.

- [ ] **Step 2: Run OCR**

```bash
npm run ocr
```

Verify OCR text appears on entries via the admin UI.

- [ ] **Step 3: Deploy updated content to production**

If using local D1 for migration, push migrations to production:

```bash
wrangler d1 migrations apply emptystates-db --remote
```

Or re-run migration/OCR scripts pointed at the production URL.

- [ ] **Step 4: Verify production site**

Visit the deployed URL. Confirm all 235 entries are visible, images load, search works (including OCR text), and filters work.

- [ ] **Step 5: Remove old content directory (optional)**

Once migration is confirmed complete:

```bash
git rm -r content/
git commit -m "chore: remove old markdown content (migrated to D1/R2)"
```

---

### Task 15: Thumbnail Generation at Build Time

**Files:**
- Create: `scripts/thumbnails.ts`
- Modify: `package.json` (add script)

- [ ] **Step 1: Install sharp**

```bash
npm install sharp
```

- [ ] **Step 2: Create scripts/thumbnails.ts**

```ts
// scripts/thumbnails.ts
import sharp from "sharp";

/**
 * Generates 3 thumbnail sizes for each state image.
 * Fetches images from R2 (via EMDash API), resizes, and uploads back.
 *
 * Sizes: small (300px wide), medium (600px wide), large (1200px wide).
 * Run: npm run thumbnails
 * Requires dev server to be running.
 */

const API_BASE = "http://localhost:4321/_emdash/api";
const SIZES = [
  { name: "sm", width: 300 },
  { name: "md", width: 600 },
  { name: "lg", width: 1200 },
];

interface State {
  id: string;
  data: {
    slug: string;
    title: string;
    screenshot?: { url: string; id: string };
  };
}

async function fetchStates(): Promise<State[]> {
  const res = await fetch(`${API_BASE}/collections/states/entries`);
  if (!res.ok) throw new Error(`Failed to fetch states: ${res.status}`);
  const json = await res.json();
  return json.entries ?? json;
}

async function downloadImage(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download: ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function uploadThumbnail(
  buffer: Buffer,
  filename: string
): Promise<{ url: string }> {
  const formData = new FormData();
  const blob = new Blob([buffer], { type: "image/webp" });
  formData.append("file", blob, filename);

  const res = await fetch(`${API_BASE}/media`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}

async function main() {
  const states = await fetchStates();
  console.log(`Processing ${states.length} states...`);

  for (const state of states) {
    const imgUrl = state.data.screenshot?.url;
    if (!imgUrl) continue;

    console.log(`Thumbnails: ${state.data.title}`);

    try {
      const original = await downloadImage(imgUrl);

      for (const size of SIZES) {
        const resized = await sharp(original)
          .resize(size.width, null, { withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();

        const filename = `${state.data.slug}-${size.name}.webp`;
        await uploadThumbnail(resized, filename);
        console.log(`  -> ${size.name} (${size.width}px): ${resized.length} bytes`);
      }
    } catch (err) {
      console.error(`  -> FAILED: ${err}`);
    }
  }

  console.log("Done.");
}

main();
```

**Note:** This is a first-pass approach. In a more mature setup, thumbnail URLs would be stored as fields on the state entry for use in `srcset`. For now, thumbnails are uploaded to R2 with predictable filenames (`{slug}-sm.webp`, etc.) and referenced by convention in templates.

- [ ] **Step 3: Add npm script**

Add to `package.json` scripts:

```json
{
  "scripts": {
    "thumbnails": "npx tsx scripts/thumbnails.ts"
  }
}
```

- [ ] **Step 4: Update GalleryCard.astro to use srcset**

Update the image rendering in `src/components/GalleryCard.astro` to reference thumbnail URLs by convention:

```astro
---
// Construct thumbnail URLs from slug
const baseMediaUrl = image.url.substring(0, image.url.lastIndexOf("/"));
const smUrl = `${baseMediaUrl}/${slug}-sm.webp`;
const mdUrl = `${baseMediaUrl}/${slug}-md.webp`;
const lgUrl = `${baseMediaUrl}/${slug}-lg.webp`;
---
```

Then in the ZoomIsland or img tag, add `srcSet`:

```html
<img
  src={image.url}
  srcset={`${smUrl} 300w, ${mdUrl} 600w, ${lgUrl} 1200w`}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  loading="lazy"
/>
```

**Note:** The exact media URL pattern will depend on how EMDash serves R2 files. Adjust the URL construction once the actual pattern is confirmed.

- [ ] **Step 5: Test thumbnail generation**

```bash
npm run thumbnails
```

Expected: WebP thumbnails generated at 3 sizes and uploaded to R2.

- [ ] **Step 6: Commit**

```bash
git add scripts/thumbnails.ts package.json src/components/GalleryCard.astro
git commit -m "feat: add build-time thumbnail generation with sharp"
```

---

### Task 16: Focus Mode Toggle for Desktop Entries

**Files:**
- Create: `src/components/FocusModeToggle.tsx`
- Modify: `src/styles/gallery.css`

- [ ] **Step 1: Create FocusModeToggle.tsx**

```tsx
// src/components/FocusModeToggle.tsx
import { useState, useEffect } from "react";

export default function FocusModeToggle() {
  const [focusMode, setFocusMode] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-focus-mode",
      focusMode ? "on" : "off"
    );
  }, [focusMode]);

  return (
    <button
      className="focus-toggle"
      onClick={() => setFocusMode(!focusMode)}
      aria-pressed={focusMode}
      title={focusMode ? "Show full screenshots" : "Crop to focal points"}
    >
      {focusMode ? "Full view" : "Focus mode"}
    </button>
  );
}
```

- [ ] **Step 2: Add focus mode styles to gallery.css**

Append to `src/styles/gallery.css`:

```css
.focus-toggle {
  padding: var(--space-xs) var(--space-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg);
  color: var(--color-text-muted);
  font-size: 0.75rem;
  cursor: pointer;
  font-family: inherit;
}

.focus-toggle:hover {
  border-color: var(--color-text);
  color: var(--color-text);
}

/* Focus mode: crop wide cards to focal point */
[data-focus-mode="on"] .gallery-card--wide img {
  object-fit: cover;
  width: 100%;
  height: 100%;
}

[data-focus-mode="on"] .gallery-card--wide .zoom-container {
  align-items: stretch;
}
```

The `object-position` for each card is set inline via the `focalX`/`focalY` values. Update `GalleryCard.astro`:

```astro
<div
  class:list={["gallery-card", { "gallery-card--wide": isWide }]}
  style={`--focal-x: ${focalX}%; --focal-y: ${focalY}%;`}
>
```

Add to gallery.css:

```css
[data-focus-mode="on"] .gallery-card--wide img {
  object-position: var(--focal-x) var(--focal-y);
}
```

- [ ] **Step 3: Add FocusModeToggle to index.astro**

```astro
---
import FocusModeToggle from "../components/FocusModeToggle.tsx";
---

<!-- Add before <Gallery> in the template, after FilterBar -->
<div style="display: flex; justify-content: flex-end; margin-bottom: var(--space-sm);">
  <FocusModeToggle client:idle />
</div>
```

- [ ] **Step 4: Verify focus mode**

Run `npm run dev`. Click the "Focus mode" button. Confirm desktop/TV/game cards switch from full-image view to cropped-to-focal-point view.

- [ ] **Step 5: Commit**

```bash
git add src/components/FocusModeToggle.tsx src/styles/gallery.css src/pages/index.astro src/components/GalleryCard.astro
git commit -m "feat: add focus mode toggle for desktop entries"
```

---

## Task Dependency Order

```
Task 1 (scaffold) → Task 2 (seed) → Task 3 (layout/styles)
                                         ↓
Task 4 (gallery components) → Task 5 (homepage) → Task 7 (filters)
                                   ↓
                              Task 6 (detail page)

Parallelizable after Task 5:
  Task 8  (search)
  Task 9  (zoom) ─── also needs Task 4
  Task 15 (thumbnails)
  Task 16 (focus mode) ── also needs Task 4

Parallelizable after Task 2:
  Task 10 (OCR)
  Task 11 (migrate)

Sequential final steps:
  Task 12 (deploy) ── after Task 5
  Task 13 (cleanup) ─ after Task 12
  Task 14 (prod data) ─ after Task 12 + Task 11 + Task 10 + Task 15
```

Tasks 8, 9, 10, 11, 15, and 16 are independent of each other and can be parallelized where their prerequisites are met.
