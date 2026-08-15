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

  return row ? `/s/${row.slug}` : null;
}
