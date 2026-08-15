/**
 * Normalises a legacy `redirect` frontmatter value into a stored path.
 *
 * `migrations/0007_redirects.sql` specifies the column as "Path only: leading
 * slash, no scheme, host, query or fragment", and the importer stored whatever
 * the frontmatter held. One of the 213 rows came out as a full Tumblr URL,
 * which no lookup could ever match: resolution compares against `url.pathname`.
 *
 * Pure, so the rule the schema states is enforced in one place and testable.
 */

export function normalizeRedirectPath(value: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  let path = trimmed;

  // An absolute URL keeps only its path. Parsed rather than string-matched, so
  // a query or fragment goes with the host.
  if (/^https?:\/\//i.test(path)) {
    try {
      path = new URL(path).pathname;
    } catch {
      return null;
    }
  } else {
    path = path.split(/[?#]/)[0];
  }

  if (!path.startsWith("/")) path = `/${path}`;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);

  // "/" names the site root, which no entry can claim.
  return path === "/" ? null : path;
}
