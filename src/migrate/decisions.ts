/**
 * Writes a triage decision into an entry's frontmatter.
 *
 * Text surgery, not a YAML round trip. `gray-matter` can restringify a parsed
 * file, but doing so reformats dates, quoting and key order across all 254
 * entries, which would bury one deliberate change in a corpus-wide diff. Only
 * the `device` line is touched here.
 *
 * Pure, so the rule that decides where the line goes is testable without a
 * filesystem.
 */

const FENCE = /^---\r?\n/;

/** Sets or replaces frontmatter `device`. Throws if there is no frontmatter. */
export function setDeviceInFrontmatter(source: string, device: string): string {
  if (!FENCE.test(source)) {
    throw new Error("no frontmatter block to write `device` into");
  }

  const lines = source.split("\n");
  // Index of the closing fence. Line 0 is the opening one.
  const close = lines.findIndex((line, i) => i > 0 && line.trim() === "---");
  if (close === -1) {
    throw new Error("unterminated frontmatter block");
  }

  const existing = lines.findIndex(
    (line, i) => i > 0 && i < close && /^device:/.test(line),
  );

  if (existing !== -1) {
    lines[existing] = `device: ${device}`;
  } else {
    // Last key in the block. A `tags:` or `related:` list would swallow a line
    // appended after it, and the closing fence is the one position no list can
    // extend past.
    lines.splice(close, 0, `device: ${device}`);
  }

  return lines.join("\n");
}
