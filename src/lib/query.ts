import { basePath } from "./pagination";

/**
 * Rewrites the current query string for a link.
 *
 * The toolbar's facets, the Clear button and the pager are all links, so the
 * whole filter interface is this one function plus `<a href>`. Nothing about
 * filtering needs JavaScript, which is why there is no facet island.
 *
 * `null` removes a parameter — that is what Any and Clear are.
 */
export function withParams(
  url: URL,
  changes: Record<string, string | number | null>,
): string {
  const next = new URL(url);

  for (const [key, value] of Object.entries(changes)) {
    if (value === null || value === "") next.searchParams.delete(key);
    else next.searchParams.set(key, String(value));
  }

  return `${next.pathname}${serialise(next.searchParams)}`;
}

/**
 * A query string carrying literal commas.
 *
 * `URLSearchParams.toString` percent-encodes the comma as `%2C`. A reader
 * decodes both spellings to the same value, so the difference is invisible to
 * the site and visible to a search engine as two addresses. `canonicalPath`
 * writes the literal form, so every link does too.
 */
function serialise(params: URLSearchParams): string {
  const search = [...params]
    .map(([k, v]) => `${k}=${v.split(",").map(encodeURIComponent).join(",")}`)
    .join("&");
  return search ? `?${search}` : "";
}

/**
 * Reads a comma-separated parameter back as a list.
 *
 * Tags combine, and Google's ecommerce URL guidance asks that one parameter
 * appear once, so the values ride in a single `tag=` pair.
 */
export function readList(url: URL, key: string): string[] {
  const raw = url.searchParams.get(key);
  if (!raw) return [];
  return raw.split(",").map((v) => v.trim()).filter(Boolean);
}

/**
 * Adds or removes one value of a comma-separated parameter, for multi-select
 * tags.
 *
 * `withParams` sets a parameter to a single value, which is right for device
 * and OS — one of each. Each row in the tag popover is the link that flips its
 * own value inside the one `tag` parameter.
 *
 * The page resets to the base path: narrowing from page 3 of a longer result
 * set lands past the end of a shorter one.
 */
export function toggleParam(url: URL, key: string, value: string): string {
  const current = readList(url, key);
  const values = current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];

  const next = new URL(url);
  if (values.length) next.searchParams.set(key, values.join(","));
  else next.searchParams.delete(key);

  // The page number is a path segment, so returning to page 1 means dropping
  // it from the path.
  const base = basePath(next.pathname);

  return `${base}${serialise(next.searchParams)}`;
}
