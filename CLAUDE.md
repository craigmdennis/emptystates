# EmptyStates (emptystat.es)

A curated gallery of 235+ empty state UI designs — screens shown when no data is available in an application. Built as a reference for designers and developers.

## Tech Stack

- **Framework:** Gatsby 4.5 (React 17) with GraphQL
- **Node:** v14.18.3 (see .nvmrc)
- **Styling:** PostCSS with SCSS syntax, CSS Modules, CSS custom properties
- **Content:** Markdown + YAML frontmatter in `/content/states/`
- **Images:** gatsby-plugin-image + sharp for optimization
- **Deployment:** Netlify (see netlify.toml)

## Commands

```bash
npm run dev       # Start dev server (localhost:8000)
npm run build     # Production build
npm run serve     # Serve production build locally
npm run clean     # Clear Gatsby cache
npm run format    # Prettier formatting
```

## Project Structure

```
src/
  components/     # React components (layout, gallery, preview, navigation, etc.)
  templates/      # Page templates (index, post, tags)
  pages/          # Static pages (404)
  styles/         # CSS modules + base.css (variables, dark mode, resets)
  images/         # SVG icons
  utils/          # Helpers (displayTagNameCorrectly.js)
content/
  states/         # 235+ markdown entries, each with frontmatter + image
```

## Content Format

Each state is a markdown file in `content/states/<slug>/index.md`:

```yaml
---
title: "State name"
date: "ISO timestamp"
image: "./filename.jpg"
tags:
  - mobile
  - ios
referral: "https://..."   # optional
redirect: "/old-path"     # optional
---
```

## Key Conventions

- Components use PropTypes for type checking
- CSS Modules imported as `import * as styles from '...'`
- CSS custom properties for theming (dark mode via `prefers-color-scheme`)
- Slugs prefixed with `/s/` for states, `/tags/` for tag pages
- 60 posts per page (POSTS_PER_PAGE in gatsby-node.js)
- ESLint + Prettier configured (single quotes, 2-space indent)

## Page Generation (gatsby-node.js)

- Individual state pages from markdown files
- Paginated index pages (60 per page)
- Tag-filtered gallery pages (e.g., `/tags/mobile/`)
- Redirect handling from frontmatter
