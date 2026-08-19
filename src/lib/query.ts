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

  const search = next.searchParams.toString();
  return search ? `${next.pathname}?${search}` : next.pathname;
}

/**
 * Adds or removes one value of a repeatable parameter, for multi-select tags.
 *
 * `withParams` sets a parameter to a single value, which is right for device
 * and OS — one of each. Tags combine, so they ride as repeated `tag=` pairs
 * and each row in the popover is the link that flips its own.
 *
 * The page resets: narrowing from page 3 of a longer result set lands past
 * the end of a shorter one.
 */
export function toggleParam(url: URL, key: string, value: string): string {
  const next = new URL(url);
  const kept = next.searchParams.getAll(key).filter((v) => v !== value);
  const values = kept.length === next.searchParams.getAll(key).length
    ? [...kept, value]
    : kept;

  next.searchParams.delete(key);
  next.searchParams.delete("page");
  for (const v of values) next.searchParams.append(key, v);

  const search = next.searchParams.toString();
  return search ? `${next.pathname}?${search}` : next.pathname;
}
