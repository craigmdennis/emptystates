/**
 * Builds a page for one judgement call: which of the imported entries carry a
 * device their screenshot's shape contradicts.
 *
 * The migration reports these but never changes them, so every row here is
 * live in D1 under the device it claims. This renders each one at its true
 * aspect ratio, grouped by claim, so the call can be made by looking rather
 * than by reading ratios off a table.
 *
 *   npx tsx scripts/review-device-shapes.ts
 *
 * Reads the local D1 the migration wrote. Images are referenced from
 * `content/states/` by relative path, so open the file from disk — this is a
 * local review tool, not something to publish.
 */

import { writeFile } from "node:fs/promises";
import { getPlatformProxy } from "wrangler";
import { legacyDir, readEntryMeta } from "./corpus";

const OUT_PATH = "docs/device-shape-review.html";

type Row = {
  slug: string;
  title: string;
  device_type: string;
  aspect_ratio: number;
  width: number;
  height: number;
  min_ratio: number;
  max_ratio: number;
  legacy_path: string | null;
};

const { env, dispose } = await getPlatformProxy<{ DB: D1Database }>({
  remoteBindings: false,
});

try {
  // Mirrors the importer's check, asked of the data rather than the corpus:
  // a device whose own configured range excludes the picture's shape.
  const { results } = await env.DB.prepare(
    `SELECT s.slug, s.title, s.device_type, s.aspect_ratio, s.width, s.height,
            d.min_ratio, d.max_ratio,
            (SELECT r.from_path FROM state_redirects r
              WHERE r.state_id = s.id AND r.from_path LIKE '/s/%'
              LIMIT 1) AS legacy_path
       FROM states s
       JOIN device_types d ON d.slug = s.device_type
      WHERE d.min_ratio IS NOT NULL
        AND (s.aspect_ratio < d.min_ratio OR s.aspect_ratio > d.max_ratio)`,
  ).all<Row>();

  const outsideBy = (r: Row) =>
    r.aspect_ratio > r.max_ratio
      ? r.aspect_ratio - r.max_ratio
      : r.min_ratio - r.aspect_ratio;

  const measured = await Promise.all(
    results
      .sort((a, b) => outsideBy(b) - outsideBy(a))
      .map(async (r) => {
        const dir = legacyDir(r.slug, r.legacy_path);
        const meta = await readEntryMeta(dir);
        return { ...r, src: meta.src, dir, setByHand: meta.deviceOverride };
      }),
  );

  // A device somebody chose is settled, matching the importer, so this page
  // lists only what nobody has looked at yet.
  const cards = measured.filter((c) => !c.setByHand);

  const byDevice = new Map<string, typeof cards>();
  for (const c of cards) {
    const group = byDevice.get(c.device_type);
    if (group) group.push(c);
    else byDevice.set(c.device_type, [c]);
  }

  const esc = (s: string) =>
    s.replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!,
    );

  const sections = [...byDevice.entries()]
    .map(
      ([device, group]) => `
    <section>
      <h2>Claims <code>${esc(device)}</code> <span class="count">${group.length} ${
        group.length === 1 ? "entry" : "entries"
      } — range ${group[0].min_ratio.toFixed(2)}–${group[0].max_ratio.toFixed(2)}</span></h2>
      <div class="grid">
        ${group
          .map(
            (c) => `<figure>
          <div class="shot" style="aspect-ratio:${c.width}/${c.height}">
            <img src="${esc(c.src)}" alt="${esc(c.title)}" loading="lazy">
          </div>
          <figcaption>
            <strong>${esc(c.title)}</strong>
            <span class="meta">${c.width}&times;${c.height} — ratio <b>${c.aspect_ratio.toFixed(3)}</b></span>
            <span class="slug">/s/${esc(c.slug)}</span>
          </figcaption>
        </figure>`,
          )
          .join("\n        ")}
      </div>
    </section>`,
    )
    .join("\n");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Device claim vs image shape — ${cards.length} entries</title>
<style>
  :root { color-scheme: light dark; --bg:#fff; --fg:#111; --muted:#666; --line:#e3e3e3; --card:#fafafa; }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#131313; --fg:#f0f0f0; --muted:#9a9a9a; --line:#2c2c2c; --card:#1c1c1c; }
  }
  * { box-sizing: border-box; }
  body { margin:0; padding:2rem clamp(1rem,4vw,3rem) 4rem; background:var(--bg); color:var(--fg);
         font:16px/1.55 ui-sans-serif,-apple-system,"Segoe UI",system-ui,sans-serif; }
  header { max-width: 62ch; margin-bottom: 2.5rem; }
  h1 { font-size: 1.6rem; margin:0 0 .6rem; letter-spacing:-.01em; }
  header p { color: var(--muted); margin:.5rem 0; }
  h2 { font-size:1.05rem; margin:2.5rem 0 1rem; padding-bottom:.5rem; border-bottom:1px solid var(--line);
       display:flex; align-items:baseline; gap:.75rem; flex-wrap:wrap; }
  .count { font-weight:400; color:var(--muted); font-size:.85rem; }
  code { font-family: ui-monospace,SFMono-Regular,Menlo,monospace; font-size:.9em; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:1.5rem; }
  figure { margin:0; background:var(--card); border:1px solid var(--line); border-radius:8px; overflow:hidden; }
  .shot { width:100%; background:repeating-conic-gradient(#8883 0% 25%, transparent 0% 50%) 50%/16px 16px; }
  .shot img { width:100%; height:100%; object-fit:contain; display:block; }
  figcaption { padding:.75rem .85rem; display:flex; flex-direction:column; gap:.2rem; font-size:.85rem; }
  .meta { color:var(--muted); }
  .slug { color:var(--muted); font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:.78rem;
          overflow-wrap:anywhere; }
  b { font-variant-numeric: tabular-nums; }
</style>
</head>
<body>
<header>
  <h1>Device claim vs image shape</h1>
  <p><strong>${cards.length} entries</strong> carry a device type whose configured aspect-ratio
     range excludes the picture. A legacy tag named the device; the shape says otherwise.</p>
  <p>Nothing has been changed. Every entry below is imported and live in D1 under the
     device it claims, which is why it appears here rather than being quietly reclassified.
     A wide <code>phone</code> is usually several phone screenshots side by side, and that
     is still a phone entry. Ordered worst disagreement first within each group.</p>
  <p>Two ways to settle one: retag the entry in <code>content/states/</code>, or widen the
     range in <code>migrations/0001_taxonomies.sql</code>. Neither needs a schema migration.</p>
</header>
${sections}
</body>
</html>
`;

  await writeFile(OUT_PATH, html, "utf8");
  console.log(`${cards.length} entries -> ${OUT_PATH}`);
  for (const [device, group] of byDevice) {
    console.log(`  claims ${device}: ${group.length}`);
  }
} finally {
  await dispose();
}
