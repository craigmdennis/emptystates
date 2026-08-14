/**
 * The seam between the two halves of the migration.
 *
 * Reading the corpus needs `fs`, `glob` and `sharp` — a native addon that
 * cannot load in workerd. Writing it needs D1 and R2 bindings, which only exist
 * inside a Worker. Nothing can hold both, so the reader produces `LegacyEntry`
 * values in Node and the importer consumes them wherever it happens to run.
 *
 * Keeping this file free of imports is what makes the split hold: the importer
 * and its Workers-pool tests can name the type without dragging Node in.
 */

export type LegacyEntry = {
  /**
   * The directory or filename the entry lives under today, and therefore the
   * live `/s/<slug>` URL. The importer reuses it verbatim when it is already a
   * clean slug, which is what keeps existing links resolving.
   */
  legacySlug: string;
  sourcePath: string;

  title: string;
  /** ISO 8601 UTC. `gray-matter` yields a Date; the reader stringifies it. */
  publishedAt: string;
  /** Legacy `product`. Present on 57 of 235 entries. */
  appName: string | null;
  /** Legacy `referral`. Present on 3. */
  appUrl: string | null;
  /** Unclassified legacy `tags`, passed to `classifyTag` by the importer. */
  rawTags: string[];
  /**
   * Frontmatter `device`, absent from the legacy corpus and written back by
   * `scripts/apply-decisions.ts` when someone settles a case the migration
   * flagged. It beats the device any tag implies, and it exists as its own
   * field because several legacy tags name a device and an OS at once —
   * `iphone` is both — so retagging to change one would silently change the
   * other.
   */
  deviceOverride: string | null;
  /** Legacy `related`, holding titles rather than slugs. Resolved in pass two. */
  relatedTitles: string[];
  /** Legacy `redirect`, an inbound path that must keep resolving. */
  redirectPath: string | null;
  /** Markdown body. Only 4 entries have one, all of them attribution lines. */
  bodyText: string | null;
  /** Orphaned images arrive as drafts; everything with frontmatter is live. */
  status: "published" | "draft";

  image: {
    filename: string;
    /** Lowercase, no leading dot. */
    extension: string;
    bytes: Uint8Array;
    width: number;
    height: number;
    byteSize: number;
  };
};
