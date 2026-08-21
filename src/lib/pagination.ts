/**
 * The page number, as a path segment.
 *
 * Master published `/2` and `/tags/mobile/2`, and `/2` keeps resolving here
 * rather than redirecting to a query parameter. Filters stay in the query
 * string, so one address is a path for the page and a query for the facets.
 *
 * Pure, so the root rest route's guard is testable without a request. That
 * guard is load-bearing: `[...page]` matches every path no other route
 * claimed, and a page that renders the gallery for `/wp-admin` would answer
 * a scanner with a 200.
 */

/** `\d+` alone, so `02`, `+2`, `2.0` and non-ASCII digits are all rejected. */
const BARE_INTEGER = /^\d+$/;

export function parsePageSegment(segment: string | undefined): number | null {
  if (!segment) return 1;
  if (!BARE_INTEGER.test(segment)) return null;

  const page = Number(segment);
  // Leading zeros survive the regex but name an address `/` already holds.
  if (String(page) !== segment) return null;
  // `/1` and `/0` are addresses for a page reachable at the base path.
  return page >= 2 ? page : null;
}

export function pageHref(base: string, page: number, search: string): string {
  const path = page <= 1 ? base : `${base === "/" ? "" : base}/${page}`;
  const at = path || "/";
  return search ? `${at}?${search}` : at;
}

/**
 * The address page one of a list is served at.
 *
 * Choosing a filter returns here: narrowing from page 3 of a longer result
 * set lands past the end of a shorter one, and that address is a 404. The
 * pager also reduces its own path this way to build every other page's link.
 */
export function basePath(pathname: string): string {
  return pathname.replace(/\/\d+$/, "") || "/";
}
