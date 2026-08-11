/**
 * Resolves the legacy corpus's duplicate storage forms into one entry per slug.
 *
 * `content/states/` holds every entry twice: as `<slug>.md` with its image
 * loose at the top level, and again as `<slug>/index.md` with the image beside
 * it. The pairs are byte-identical in every case checked, but "checked" is not
 * "guaranteed", so the hashes are compared and any disagreement is reported
 * rather than silently resolved.
 *
 * Pure, and free of `fs` and `sharp`, so it runs inside the Workers test pool
 * where the reader that feeds it cannot.
 */

export type Candidate = {
  /** Directory name, or flat filename without its `.md`. Also the legacy URL. */
  slug: string;
  form: "directory" | "flat";
  /** Null when a directory holds an image but no `index.md`. */
  markdownPath: string | null;
  imagePath: string | null;
  /** Digest of the image bytes; null when there is no image. */
  imageHash: string | null;
};

export type Resolution = {
  /** One candidate per slug, slug-ordered. Includes orphans. */
  keep: Candidate[];
  skipped: {
    path: string;
    slug: string;
    reason: "duplicate-of-directory";
  }[];
  /** Both forms present, images disagree. The directory still wins. */
  conflicts: { slug: string; directoryHash: string; flatHash: string }[];
  /** Slugs kept with an image but no frontmatter — imported as drafts. */
  orphans: string[];
  /** Slugs with neither markdown nor image. Nothing to import. */
  empty: string[];
};

export function resolveCandidates(candidates: Candidate[]): Resolution {
  const bySlug = new Map<string, Candidate[]>();
  for (const c of candidates) {
    const group = bySlug.get(c.slug);
    if (group) group.push(c);
    else bySlug.set(c.slug, [c]);
  }

  const resolution: Resolution = {
    keep: [],
    skipped: [],
    conflicts: [],
    orphans: [],
    empty: [],
  };

  for (const slug of [...bySlug.keys()].sort()) {
    const group = bySlug.get(slug)!;
    const directory = group.find((c) => c.form === "directory");
    const flat = group.find((c) => c.form === "flat");

    const winner = directory ?? flat;
    if (!winner) continue;

    if (directory && flat) {
      if (
        directory.imageHash &&
        flat.imageHash &&
        directory.imageHash !== flat.imageHash
      ) {
        resolution.conflicts.push({
          slug,
          directoryHash: directory.imageHash,
          flatHash: flat.imageHash,
        });
      }
      if (flat.markdownPath) {
        resolution.skipped.push({
          path: flat.markdownPath,
          slug,
          reason: "duplicate-of-directory",
        });
      }
    }

    if (!winner.imagePath) {
      // No image means no gallery card and no R2 object. There is no version of
      // this row worth writing, so it is reported and dropped rather than
      // imported as a draft.
      resolution.empty.push(slug);
      continue;
    }

    if (!winner.markdownPath) resolution.orphans.push(slug);
    resolution.keep.push(winner);
  }

  return resolution;
}
