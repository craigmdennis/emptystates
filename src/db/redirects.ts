/**
 * Looks up where a retired URL went.
 *
 * `state_redirects` holds 213 rows: 180 `/s/<legacy-dir>` paths the importer
 * replaced when a legacy directory name was not a clean slug, and 33 inbound
 * Tumblr paths carried in legacy `redirect` frontmatter. Both are matched on
 * the exact stored string, so neither form needs its own query.
 *
 * These are the URLs a real visitor has bookmarked, which is the one failure in
 * this migration that costs somebody something.
 */

/**
 * Whether a path is shaped like something the table could claim.
 *
 * Every stored path is a retired `/s/<name>` or a legacy `/post/<id>/<slug>`.
 * The middleware runs on every 404, and most 404s are scanners probing for
 * `/wp-admin` and the like, so this answers those without a D1 read.
 *
 * A new shape in the table needs a prefix here — the suite checks this against
 * every stored `from_path` so the guard cannot silently start skipping one.
 */
const CLAIMABLE = ["/s/", "/post/"];

export function couldBeRedirect(pathname: string): boolean {
  return CLAIMABLE.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Entries master publishes that this corpus dropped during triage.
 *
 * `state_redirects.state_id` is `NOT NULL REFERENCES states(id)`, so a row
 * cannot name a target that is not an entry. These eight have no successor,
 * so they answer with the gallery.
 *
 * A literal set rather than a table: eight strings that will not grow, read
 * without a D1 round trip on paths that are all scanner-adjacent anyway.
 *
 * Exported so `test/legacy-urls.test.ts` can hold it against the fixture,
 * which is the only thing keeping the two lists the same.
 */
export const RETIRED = new Set([
  "/s/no-notes-in-bear-markdown-editor-for-macos",
  "/s/tumblr_mggzbrxUhV1rdf37to1_1280",
  "/s/tumblr_mh5iv6T19s1rdf37to1_1280",
  "/s/tumblr_mhpzfw7qkv1rdf37to1_1280",
  "/s/tumblr_moiu2y7o7N1rdf37to1_1280",
  "/s/tumblr_mp38ylJOSa1rdf37to1_1280",
  "/s/tumblr_mt8030S4ue1rdf37to1_1280",
  "/s/tumblr_n5hldmNcyT1rdf37to1_1280",
]);

export async function resolveRedirect(
  db: D1Database,
  path: string,
): Promise<string | null> {
  // Gatsby wrote every URL with a trailing slash, so an inbound link from the
  // old site carries one and the stored path does not.
  const candidates = [path];
  if (path.endsWith("/") && path.length > 1) candidates.push(path.slice(0, -1));
  else candidates.push(`${path}/`);

  const row = await db
    .prepare(
      `SELECT s.slug FROM state_redirects r
         JOIN states s ON s.id = r.state_id
        WHERE r.from_path IN (?, ?)
        LIMIT 1`,
    )
    .bind(candidates[0], candidates[1])
    .first<{ slug: string }>();

  if (row) return `/s/${row.slug}`;

  // After the table, so a path that gains a real successor wins over the set.
  return candidates.some((c) => RETIRED.has(c)) ? "/" : null;
}
