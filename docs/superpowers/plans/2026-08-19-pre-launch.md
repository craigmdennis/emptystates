# Pre-launch: analytics endpoint and Open Graph cards

Two tasks moved out of `2026-08-11-foundation-gallery.md` on 2026-08-19. Both
were written there and are unchanged apart from the corrections noted below.

**Runs after phase 2** — spec `2026-08-11-02-ingest-search-design.md` — and
before the site is announced. Neither task blocks the foundation gallery from
being deployed.

## Why each one waits

**Task 1, `/api/view-pref`.** Its only caller is the layout switch in
`src/components/Toolbar.astro`, which flips `data-view` and writes
`localStorage` without reporting anything. Nothing breaks while the endpoint is
absent. One promise is outstanding: `/privacy` already tells the reader that the
layout choice is sent to a first-party endpoint and that an ad blocker will not
stop it, so the endpoint has to behave the way that page describes, and the
opt-out flag has to be read before it is called.

**Task 2, Open Graph cards.** Each card embeds a screenshot read from R2 and is
keyed by state id, so every id in the corpus has to be settled before any card
is rendered. Phase 2 adds the ingest path, which mints ids for new entries and
may retitle existing ones — a card carries the title and app name, so a retitle
invalidates it as surely as a re-import does. Rendering 235 cards before that is
235 cards to render again.

## Corrections to apply before writing either task

1. **`locals.runtime.env` is gone.** Astro 6 removed it. The binding comes from
   `getDb()` in `src/db/client.ts`, which reads the D1 binding from
   `cloudflare:workers`. Task 1's code below still shows the old API.
2. **`locals.runtime.ctx.waitUntil` moves with it.** Import `ctx` from
   `cloudflare:workers` for the Plausible forward.
3. **The opt-out flag gates the call.** `localStorage["es:optout"]`, plus
   `navigator.doNotTrack === "1"` and `navigator.globalPrivacyControl`. The
   switch has to check all three before `sendBeacon`, which is what `/privacy`
   states.

---

## Task 1: `/api/view-pref` and the Plausible forward

**Files:**
- Create: `src/pages/api/view-pref.ts`
- Test: `test/view-pref.test.ts`

**Interfaces:**
- Consumes: `env.DB`
- Produces: `POST /api/view-pref` → 204

- [ ] **Step 1: Write the failing test**

```ts
it("increments the counter for view and day", async () => {
  const res = await SELF.fetch("https://x/api/view-pref", {
    method: "POST",
    body: JSON.stringify({ view: "square", viewport: 1280 }),
  });
  expect(res.status).toBe(204);

  const row = await env.DB
    .prepare("SELECT n FROM layout_prefs WHERE view='square'").first<{ n: number }>();
  expect(row?.n).toBe(1);
});

it("rejects an unknown view value", async () => {
  const res = await SELF.fetch("https://x/api/view-pref", {
    method: "POST", body: JSON.stringify({ view: "spiral", viewport: 1280 }),
  });
  expect(res.status).toBe(400);
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `npm test -- view-pref`
Expected: FAIL — 404.

- [ ] **Step 3: Implement the endpoint**

```ts
export const POST: APIRoute = async ({ request, locals }) => {
  const { view, viewport } = await request.json();
  if (view !== "justified" && view !== "square") return new Response(null, { status: 400 });

  const env = locals.runtime.env;
  const day = new Date().toISOString().slice(0, 10);

  await env.DB.prepare(
    `INSERT INTO layout_prefs (view, day, n) VALUES (?, ?, 1)
     ON CONFLICT(view, day) DO UPDATE SET n = n + 1`
  ).bind(view, day).run();

  locals.runtime.ctx.waitUntil(
    fetch("https://plausible.io/api/event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // The VISITOR's UA and IP. A Worker egress IP is dropped by bot
        // filtering, still returns 202, and shows only in x-plausible-dropped.
        "User-Agent": request.headers.get("User-Agent") ?? "",
        "X-Forwarded-For": request.headers.get("CF-Connecting-IP") ?? "",
      },
      body: JSON.stringify({
        domain: "emptystat.es",
        name: "View Mode",
        url: request.headers.get("Referer") ?? "https://emptystat.es/",
        props: { view, viewport: String(viewport) },
      }),
    }).then(r => {
      if (r.headers.get("x-plausible-dropped") === "1") {
        console.error("plausible dropped View Mode event");
      }
    })
  );

  return new Response(null, { status: 204 });
};
```

- [ ] **Step 4: Run the tests**

Run: `npm test -- view-pref`
Expected: PASS both.

- [ ] **Step 5: Verify against real Plausible after first deploy**

Toggle the view on the deployed site, then confirm the `View Mode` goal appears in Plausible with a `view` property breakdown, and that no `x-plausible-dropped` warning appears in `npx wrangler tail`.

Do not skip this. A wrong `X-Forwarded-For` produces silence, not an error.

- [ ] **Step 6: Commit**

```bash
git add src/pages/api/view-pref.ts test/view-pref.test.ts
git commit -m "feat: add view preference endpoint with Plausible forward"
```


---

## Task 2: Open Graph card per state

**Runs last, immediately before deploy.** Each card embeds a screenshot read
from R2 and is stored at `og/<state id>.png`, so every id in the corpus has to
be settled before any card is rendered. Re-running the migration mints fresh
ULIDs and retires every key — which happened to the display variants when
issues #26 and #27 were fixed, and cost one rebuild. Rendering 235 cards on a
stale id set costs more, and a card also embeds the title and app name, so a
content correction invalidates it as surely as a re-import does.

Every `/s/<slug>` link currently unfurls with whatever `Base.astro` is given,
which is nothing — the detail page passes no `image`. A gallery of screenshots
whose links unfurl blank is the one place a missing image costs a reader
something.

Follows the process in `~/Sites/craigmdennis.com`, with the generation half
moved and the rasteriser swapped. That site is static and renders cards at
build time in `src/pages/og/x/[slug].png.ts`; this one runs `output: "server"`
on Workers, and no native addon loads in workerd — the same constraint that
split the migration into a Node reader and a runtime-agnostic importer. Cards
are rendered in Node and put in R2, which the architecture already requires for
images so they never invoke the Worker.

`sharp` rasterises the SVG. The other site uses `@resvg/resvg-js` for that
step, and `sharp` is already here doing the same job for every image the
migration measures.

Keyed by state id, not slug: the id is a ULID and never changes, so a later
retitle moves the page's URL without orphaning its card.

**Files:**
- Create: `src/lib/og/template.ts`, `src/lib/og/render.ts`, `src/lib/og/assets.ts`, `scripts/build-og-cards.ts`
- Add: `src/fonts/og/inter-regular.ttf`, `src/fonts/og/inter-semibold.ttf`
- Modify: `src/layouts/Base.astro`, `src/pages/s/[slug].astro`, `package.json`
- Test: `test/og.test.ts`

**Interfaces:**
- Consumes: `listStates` from Task 5, `StateRow.r2_key`, the `MEDIA` binding
- Produces: `og/<id>.png` in R2 for every published state; `og:image` on every detail page

- [ ] **Step 1: Install satori and the fonts**

```bash
npm install --save-dev satori
mkdir -p src/fonts/og
cp ~/Sites/craigmdennis.com/src/fonts/og/inter-regular.ttf src/fonts/og/
cp ~/Sites/craigmdennis.com/src/fonts/og/inter-semibold.ttf src/fonts/og/
```

satori alone. The other site pairs it with `@resvg/resvg-js`, which rasterises
SVG — work `sharp` already does here, and `sharp` is a dependency the migration
uses to measure every image. satori adds flexbox layout to SVG, which nothing
in this repo does.

A dev dependency: `scripts/build-og-cards.ts` is the only importer, so nothing
new reaches the client or the Worker. TTF and not woff2 — satori parses font
tables itself and cannot read woff2. Advercase stays behind, licensed for the
other site.

- [ ] **Step 2: Write `src/lib/og/template.ts`**

The only place card layout lives. A function returning satori-compatible
vnodes, exporting `OG_WIDTH = 1200` and `OG_HEIGHT = 630`.

The screenshot is the subject here, so it takes the place the company logo
holds on the other site: the state's own image, contained (never cropped) on a
`--stone` ground, with the title in Inter SemiBold and the app name, device and
OS in Inter Regular beneath it. Portrait phone shots leave a wide margin —
fill it with the ground colour and keep the image whole, since a cropped empty
state is no longer the thing being shown.

- [ ] **Step 3: Write `src/lib/og/render.ts` and `assets.ts`**

Both start from `~/Sites/craigmdennis.com/src/lib/og/`:

- `render.ts` — satori → SVG → `sharp` → PNG buffer. Fonts memoised in a
  module-level promise so 235 renders read each TTF once. Resolve `FONT_DIR`
  from `process.cwd()`; bundled chunk URLs do not map back to `src/`. The
  rasterise step replaces the other site's `Resvg` call:

  ```ts
  const svg = await satori(node, { width: OG_WIDTH, height: OG_HEIGHT, fonts });
  return sharp(Buffer.from(svg)).png().toBuffer();
  ```

  Pass no `density`. vips scales an SVG by `density / 72`, so the `density: 96`
  that reads as a sensible default produces a 1600×840 card. The default of 72
  gives 1200×630 exactly. Leave satori's `embedFont` at its default, which
  writes glyphs as paths, so rasterising needs no font at all.

- `assets.ts` — file → data URI, with the mime sniffed from magic bytes.
  Keep the sniffing. This corpus has the same defect the comment describes:
  `content/states/` holds `.jpg` files whose bytes are PNG, and a mislabelled
  data URI renders as an empty box.

Read the state's image from R2 through the `MEDIA` binding rather than from
disk. R2 is the source of truth after Task 4, and a deleted corpus entry should
not silently produce a card.

- [ ] **Step 4: Write `scripts/build-og-cards.ts`**

```bash
npx tsx scripts/build-og-cards.ts --dry-run   # count what would render
npx tsx scripts/build-og-cards.ts             # render and put
npx tsx scripts/build-og-cards.ts --only <slug>
```

Same shape as `scripts/migrate-legacy.ts`: `getPlatformProxy()` for the `DB`
and `MEDIA` bindings, page through `listStates`, render each card, put it at
`og/<id>.png`. Log a count at the end. Regenerate every card each run — 235
renders of a 1200×630 card costs less than tracking which inputs changed.

- [ ] **Step 5: Emit the tags**

`Base.astro` currently emits `og:image` alone (line 49). Add
`og:image:width`, `og:image:height`, `og:image:type` and `og:image:alt` when
an image is set, matching `Base.astro` on the other site — several unfurlers
skip an image whose dimensions they must fetch to learn.

`s/[slug].astro` passes `image={`https://img.emptystat.es/og/${state.id}.png`}`
and the state's title as the alt.

- [ ] **Step 6: Test**

```ts
it("renders a card at exactly 1200x630", async () => {
  const png = await renderOgPng(ogCard(FIXTURE));
  // PNG IHDR: width and height are big-endian uint32 at bytes 16 and 20.
  const view = new DataView(png.buffer);
  expect(view.getUint32(16)).toBe(1200);
  expect(view.getUint32(20)).toBe(630);
});
```

`test/og.test.ts` runs in Node, outside the Workers pool, since `sharp` is a
native addon workerd cannot load — the same reason `test/import.test.ts` had to
be split. Add a second case covering a state with a null `app_name` and a null
`os`, which 137 entries have. Assert the dimensions from the IHDR bytes: a
wrong `density` produces a valid PNG at the wrong size, so a smoke test that
only checks for output would pass.

- [ ] **Step 7: Verify against a real unfurl**

```bash
npx wrangler r2 object get emptystates-media/og/<id>.png --local --file /tmp/card.png
```

Check one card by eye, then after Task 12 deploys, paste an `/s/` URL into an
unfurl debugger. Local checking cannot confirm the tags, because
`img.emptystat.es` resolves only in production.

- [ ] **Step 8: Commit**

```bash
git add src/lib/og src/fonts/og scripts/build-og-cards.ts test/og.test.ts \
        src/layouts/Base.astro src/pages/s/ package.json
git commit -m "feat: render an Open Graph card per state into R2"
```

**Out of scope.** Cards for states arriving through the submission queue —
spec 02 owns that ingest path and should call the same `renderOgPng`. Cards
for the gallery, tag pages and the index, which share one default card.

