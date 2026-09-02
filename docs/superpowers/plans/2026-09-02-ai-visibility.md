# AI visibility

**Goal:** an assistant asked for empty state examples or inspiration —
Claude, ChatGPT, Gemini, Perplexity — cites `emptystat.es`.

## Findings, checked 2026-08-30

1. **Crawler access is open.** The zone's bot settings disable every AI
   protection (`ai_bots_protection`, `ai_training`, `ai_search`,
   `ai_user` all off, managed robots.txt off — read from the Cloudflare
   API), `robots.txt` allows everything, and a sitemap is served.
   Cloudflare blocks AI crawlers by default on zones created after
   2025-07, and from 2026-09-15 blocks training and agent crawlers by
   default on new domains. This zone predates both and keeps its open
   settings. The dashboard now controls three categories (Search, Agent,
   Training) per zone.
2. **The site is indexed** — a `site:emptystat.es` query returns the
   gallery, tag pages, and detail pages, indexed since about 2019.
3. **Topical queries return competitors.** "Empty state design examples
   gallery" surfaces Mobbin, Dribbble, SaaS Interface, the Component
   Gallery, Pencil & Paper, Mockplus, Carbon, and NN/g. `emptystat.es`
   is absent. Assistants that search the web cite what those queries
   return, so absence there is absence from AI answers.
4. **Entity data is stale.** One AI search summary attributed the site
   to a different person. No page on the site states who runs it, what
   it is, or since when, so a model has nothing to correct itself with.
5. **`llms.txt` has no measured effect on AI search.** Log studies find
   97% of published files receive zero requests, correlation studies
   find no citation lift, and Google states it has no ranking effect.
   Its one demonstrated use is documentation consumed by coding agents.
6. **What predicts citations:** mentions on external sites (about three
   times the predictive power of backlinks), fresh content, pages
   structured as direct answers, and consistent entity signals. ChatGPT
   search reads Bing's index, Gemini reads Google's.
7. **The v2 rebuild ships** og tags, canonicals, per-page descriptions,
   and a sitemap without `lastmod`. No JSON-LD, no about page, and most
   legacy entries carry placeholder titles and empty descriptions until
   the vision backfill (#33).

## On the site

- [ ] **An about page.** What the site is, who maintains it, its history
      since the Tumblr era, how a screenshot gets in, and image rights.
      This is the page an assistant quotes when asked what
      `emptystat.es` is, and the correction for finding 4.
- [ ] **JSON-LD.** `WebSite` and `CollectionPage` on the gallery,
      `ImageObject` per entry carrying app name, device, OS, and tags,
      and a `Person` for the maintainer linked from the about page.
- [ ] **`lastmod` in the sitemap** from `published_at`, so crawlers see
      which pages changed and that the collection is alive.
- [ ] **A sentence or two of prose on each tag page** defining the
      pattern, which turns the page into a direct answer for "empty
      state examples for onboarding" and its siblings.
- [ ] **The vision backfill (#33)** fills titles, descriptions, and
      screen text — the words an answer engine can quote about an image
      it cannot see.
- [ ] **`llms.txt`, optional.** One static file naming the site, the tag
      index, and the about page. Costs minutes, expected effect near
      zero, kept only because coding agents read the format.

## Off the site

Mentions are the strongest predictor, and every item here is one.

- [ ] **A relaunch announcement when v2 ships.** Show HN, Designer News,
      and the design subreddits. A fresh wave of mentions on
      high-authority domains is what the citation studies reward.
- [ ] **Pull requests to the GitHub awesome lists** (awesome-design and
      kin) and submissions to the directories designers use:
      toools.design, uigoodies, sidebar.io.
- [ ] **Outreach to the roundups assistants cite today** — Pencil &
      Paper, Mockplus, Hongkiat (whose older article already praises the
      site) — asking for inclusion in the next update.
- [ ] **Consistent naming everywhere:** "Empty States (emptystat.es)"
      with the maintainer's name in the footer, the about page, and
      profile bios, so models bind the site to one entity.

## Measurement

- [ ] **Google Search Console and Bing Webmaster Tools** with the
      sitemap submitted. Bing's index feeds ChatGPT and Copilot, so Bing
      coverage is the cheapest unattended win available.
- [ ] **Cloudflare's AI crawler analytics** monthly: which AI crawlers
      fetch, and how often, from the zone dashboard.
- [ ] **A monthly probe:** ask Claude, ChatGPT, Gemini, and Perplexity
      for the best empty state galleries and record whether and where
      the site is cited. The probe is the only direct measure of the
      goal.

## Decisions this plan waits on

- The about page copy and how much history it tells.
- Whether and where to post the relaunch, and its timing against the
  v2 launch.
- Whether outreach to roundup authors is wanted at all.
