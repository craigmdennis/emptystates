/**
 * Routes a legacy `/tags/<x>` URL to the facet that tag became.
 *
 * Gatsby built a page for every raw value in the frontmatter `tags` array, and
 * that array conflated three dimensions: `mobile` and `desktop` are devices,
 * `ios` and `android` are operating systems, and the rest are tags. The
 * migration split them into three columns, so `/tags/mobile` has to reach a
 * device filter to keep resolving.
 *
 * Built on `classifyTag`, the same function the importer used, so the mapping
 * cannot drift from the one that decided what each entry carries — including
 * the corpus typos it already knows (`mobil`, `emai`, `browswer`).
 */

import { classifyTag } from "../migrate/classify";

export type TagRoute =
  | { kind: "device"; value: string }
  | { kind: "os"; value: string }
  | { kind: "tag"; value: string };

export function resolveTagPath(segment: string): TagRoute | null {
  const raw = decodeURIComponent(segment).trim();
  if (!raw) return null;

  // Gatsby slugified a multi-word tag for its URL, so `first run` was published
  // as /tags/first-run. classifyTag keys on the raw form, so both are tried.
  for (const candidate of [raw, raw.replace(/-/g, " ")]) {
    const verdict = classifyTag(candidate, "");
    if (
      verdict.kind === "device" ||
      verdict.kind === "os" ||
      verdict.kind === "tag"
    ) {
      return { kind: verdict.kind, value: verdict.value };
    }
  }

  return null;
}
