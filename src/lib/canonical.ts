/**
 * The one address a page claims in `rel=canonical`.
 *
 * Three parameters change which entries a gallery returns, and everything
 * else is either display state or somebody's tracking. Filtering to an
 * allowlist means a new parameter cannot add a second indexable address for a
 * page that already has one.
 *
 * The page number is a path segment, so nothing here handles it.
 */

/** Parameters that change the result set. Order fixed, so output is stable. */
const FILTERS = ["device", "os", "tag"] as const;

/**
 * The facet views search engines should index: the bare gallery, one device,
 * or one operating system.
 *
 * The corpus has 3 devices (phone 187, desktop 45, tablet 3) and 5 operating
 * systems (android 33, ios 32, web 24, macos 8, windows 1). It has 25 tags,
 * and 20 of them carry a single entry, so a tag view repeats one detail page.
 * A combination of two facets is a search somebody runs and not a page they
 * arrive at.
 */
function isIndexable(entries: [string, string][]): boolean {
  if (entries.length === 0) return true;
  if (entries.length > 1) return false;
  return entries[0][0] === "device" || entries[0][0] === "os";
}

export function canonicalPath(url: URL): string {
  const entries: [string, string][] = [];

  for (const key of FILTERS) {
    const raw = url.searchParams.get(key);
    if (!raw) continue;
    // One comma-separated value, sorted and de-duplicated, so two click
    // orders produce one address.
    const values = [
      ...new Set(raw.split(",").map((v) => v.trim()).filter(Boolean)),
    ].sort();
    if (values.length) entries.push([key, values.join(",")]);
  }

  let path = url.pathname;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);

  if (!isIndexable(entries)) return path;

  // Built by hand: `URLSearchParams.toString` percent-encodes the comma as
  // `%2C`, and the toolbar's links carry it literally. Two spellings of one
  // address is what this function exists to remove.
  const search = entries
    .map(([k, v]) => `${k}=${v.split(",").map(encodeURIComponent).join(",")}`)
    .join("&");

  return search ? `${path}?${search}` : path;
}
