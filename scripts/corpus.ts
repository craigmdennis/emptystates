/**
 * Maps a migrated row back to the file it came from.
 *
 * The importer keeps the legacy directory name as the slug when it was already
 * URL-clean, and writes the retired path as a `/s/` redirect when it was not.
 * Reversing that is the only way a reporting tool built on D1 can point at the
 * picture on disk, and both review pages need it.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

export const CORPUS_DIR = "content/states";

/** The legacy directory name for a migrated row. */
export function legacyDir(slug: string, legacyPath: string | null): string {
  return legacyPath ? legacyPath.slice("/s/".length) : slug;
}

export type EntryMeta = {
  /** The declared image, as a path relative to `docs/`. */
  src: string;
  /** Frontmatter `device`, set by a triage session. Null when nobody has. */
  deviceOverride: string | null;
};

/**
 * Frontmatter facts the review pages need, from one read.
 *
 * The image is taken from the declared name because three directories hold more
 * than one picture, and picking the first on disk shows the wrong one. The
 * override is read so both pages can apply the same rule the importer does:
 * a device somebody chose is settled, and a settled entry stops being flagged.
 */
export async function readEntryMeta(dir: string): Promise<EntryMeta> {
  const source = path.join(CORPUS_DIR, dir, "index.md");
  const { data } = matter(await readFile(source, "utf8"));
  const declared = String(data.image ?? "").replace(/^\.\//, "");
  const device = String(data.device ?? "").trim();
  return {
    src: path.posix.join("..", CORPUS_DIR, dir, declared),
    deviceOverride: device || null,
  };
}
