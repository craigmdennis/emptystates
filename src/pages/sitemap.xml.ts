/**
 * Every address this site asks search engines to index.
 *
 * The list matches `canonicalPath` exactly: the gallery and its pages, one
 * device or one operating system and their pages, each entry, and the privacy
 * page. A tag view and any two-facet combination canonicalise back to the
 * gallery, so listing them here would contradict the page's own tag.
 *
 * Generated from D1 on request rather than written at build time. The entry
 * set changes when the corpus does, and a stale file naming a retired slug
 * sends a crawler to a redirect for nothing.
 */

import type { APIRoute } from "astro";
import { getDb } from "../db/client";
import { countStates, listStates } from "../db/states";
import { listFacets } from "../db/taxonomies";

const PER_PAGE = 60;
const ORIGIN = "https://emptystat.es";

/** `/` for page one, `/N` above it — the grammar `pageHref` builds. */
function pages(total: number, query = ""): string[] {
  const last = Math.max(1, Math.ceil(total / PER_PAGE));
  return Array.from({ length: last }, (_, i) => {
    const path = i === 0 ? "/" : `/${i + 1}`;
    return query ? `${path}?${query}` : path;
  });
}

export const GET: APIRoute = async () => {
  const db = getDb();
  const [total, facets] = await Promise.all([countStates(db), listFacets(db)]);

  const urls: string[] = [...pages(total)];

  // One facet each. `canonicalPath` self-canonicalises exactly these.
  for (const device of facets.devices) {
    urls.push(...pages(device.count, `device=${device.slug}`));
  }
  for (const os of facets.oses) {
    urls.push(...pages(os.count, `os=${os.slug}`));
  }

  // Paged rather than read whole: `listStates` caps a page at what the gallery
  // shows, and 235 entries is four round trips.
  for (let page = 1; ; page++) {
    const { rows } = await listStates(db, { page, perPage: 100 });
    if (rows.length === 0) break;
    for (const row of rows) urls.push(`/s/${row.slug}`);
    if (rows.length < 100) break;
  }

  urls.push("/privacy");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${ORIGIN}${escapeXml(u)}</loc></url>`).join("\n")}
</urlset>
`;

  return new Response(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      // An hour: the corpus grows by hand today, and a crawler re-reading a
      // list of 280 addresses costs one D1 page each time.
      "cache-control": "public, max-age=3600",
    },
  });
};

/** `&` is the only one of the five that a facet address can produce. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
