/**
 * Slug generation and collision handling.
 *
 * Pure by design and free of any runtime binding, so it is importable from the
 * Node-side corpus reader, the Workers-side importer, and the request path
 * alike. The legacy corpus already published 235 slugs as live URLs; the
 * importer prefers those over anything generated here, and `isCleanSlug` is the
 * gate that decides when it may.
 */

/**
 * Apostrophes are removed rather than replaced, so "You're" becomes "youre"
 * rather than "you-re". Everything else non-alphanumeric collapses to a single
 * hyphen.
 */
export function slugify(title: string, appName?: string | null): string {
  const trimmedApp = appName?.trim() ?? "";
  // Most legacy titles already name the app ("No services in Tower 2 for Mac"),
  // and appending it again produced "...-for-mac-in-tower". Only append when
  // the title does not already say it.
  const alreadyNamed =
    trimmedApp !== "" &&
    title.toLowerCase().includes(trimmedApp.toLowerCase());
  const base = trimmedApp && !alreadyNamed ? `${title} in ${trimmedApp}` : title;
  return base
    .toLowerCase()
    .replace(/['‘’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function dedupeSlug(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

/**
 * True when a string is already exactly what `slugify` would produce: lowercase
 * alphanumerics separated by single hyphens, no leading or trailing hyphen.
 * Legacy directory names that pass may be reused verbatim, which is what keeps
 * the existing `/s/<slug>` URLs resolving.
 */
export function isCleanSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}
