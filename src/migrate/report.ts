/**
 * The migration's account of itself.
 *
 * Every field here exists because the alternative was a silent default. The
 * point of the dry run is to put these decisions in front of a person before
 * 252 rows are written, so a section that is empty is as informative as one
 * that is full.
 */

export type MigrationReport = {
  imported: number;
  drafts: number;

  /** Flat `<slug>.md` files discarded in favour of `<slug>/index.md`. */
  skippedDuplicateFiles: string[];
  /** Both forms present, images disagreed. The directory copy won. */
  imageConflicts: { slug: string; directoryHash: string; flatHash: string }[];
  /** Candidates with neither markdown nor an image. */
  emptyDirectories: string[];
  /** Entries whose image could not be read or measured. */
  missingImages: string[];

  /** Legacy tags matching no device, OS or known tag. Nothing was guessed. */
  unmappedTags: string[];
  droppedTags: { slug: string; raw: string; reason: string }[];

  /** No tag supplied a device, so aspect ratio chose one. */
  derivedDeviceFrom: { slug: string; ratio: number; chose: string }[];
  /** Ratio matched no configured device range; a fallback was used. */
  aspectOutsideAllRanges: { slug: string; ratio: number; fellBackTo: string }[];
  /**
   * A tag named the device, and the image's shape falls outside that device's
   * range. Reported, never overridden: the ranges describe single-screen
   * captures, and a legacy `mobile` entry is often a composite of several.
   */
  deviceShapeDisagrees: {
    slug: string;
    device: string;
    ratio: number;
    min: number;
    max: number;
  }[];
  /** Frontmatter `device` settled the case, so no tag or ratio was consulted. */
  deviceSetByHand: { slug: string; device: string }[];
  /** No tag supplied an OS. Left null for the vision backfill, never guessed. */
  osLeftBlank: string[];

  /** Legacy directory name was not URL-clean, so the URL changes. */
  slugChanged: { from: string; to: string }[];
  /** Legacy `redirect` paths preserved. */
  redirectsWritten: number;
  /** Entries whose markdown body was kept as `description`. */
  bodyTextPreserved: string[];
  /** `related` titles matching no imported entry. Never guessed. */
  unresolvedRelations: { slug: string; title: string }[];
  relationsWritten: number;
};

export function emptyReport(): MigrationReport {
  return {
    imported: 0,
    drafts: 0,
    skippedDuplicateFiles: [],
    imageConflicts: [],
    emptyDirectories: [],
    missingImages: [],
    unmappedTags: [],
    droppedTags: [],
    derivedDeviceFrom: [],
    aspectOutsideAllRanges: [],
    deviceShapeDisagrees: [],
    deviceSetByHand: [],
    osLeftBlank: [],
    slugChanged: [],
    redirectsWritten: 0,
    bodyTextPreserved: [],
    unresolvedRelations: [],
    relationsWritten: 0,
  };
}

function table(headers: string[], rows: string[][]): string {
  if (rows.length === 0) return "_None._\n";
  const head = `| ${headers.join(" | ")} |`;
  const rule = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((r) => `| ${r.join(" | ")} |`).join("\n");
  return `${head}\n${rule}\n${body}\n`;
}

/** How far outside its device's range a ratio sits. Always positive here. */
function outsideBy(d: { ratio: number; min: number; max: number }): number {
  return d.ratio > d.max ? d.ratio - d.max : d.min - d.ratio;
}

function list(items: string[]): string {
  return items.length === 0
    ? "_None._\n"
    : items.map((i) => `- ${i}`).join("\n") + "\n";
}

export function formatReport(r: MigrationReport, dryRun: boolean): string {
  const out: string[] = [];

  out.push(`# Legacy migration report${dryRun ? " (dry run)" : ""}`);
  out.push("");
  out.push(
    `**${r.imported} entries** — ${r.imported - r.drafts} published, ${r.drafts} drafts. ` +
      `${r.redirectsWritten} redirects, ${r.relationsWritten} curated relations.`,
  );
  out.push("");

  out.push("## Decisions that need a human");
  out.push("");

  out.push("### Unmapped tags");
  out.push("");
  out.push(
    "Each is either a real tag missing from `TAGS` in `classify.ts`, or junk to drop. " +
      "Nothing here was imported.",
  );
  out.push("");
  out.push(list(r.unmappedTags));

  out.push("### Slugs that changed");
  out.push("");
  out.push("These URLs will not resolve at their old address without a redirect.");
  out.push("");
  out.push(
    table(
      ["From", "To"],
      r.slugChanged.map((s) => [`\`${s.from}\``, `\`${s.to}\``]),
    ),
  );

  out.push("### Ratios matching no device range");
  out.push("");
  out.push(
    "Widen a range in `device_types`, or accept the fallback. No migration needed to change one.",
  );
  out.push("");
  out.push(
    table(
      ["Slug", "Ratio", "Fell back to"],
      r.aspectOutsideAllRanges.map((a) => [
        `\`${a.slug}\``,
        a.ratio.toFixed(3),
        a.fellBackTo,
      ]),
    ),
  );

  out.push(
    `### Tagged device the image shape contradicts (${r.deviceShapeDisagrees.length})`,
  );
  out.push("");
  out.push(
    "A legacy tag named the device; the picture is a shape that device does not " +
      "produce. Nothing was changed — each entry is imported and displayed under " +
      "the device it claims, so the call can be made by looking at it. A wide " +
      "`phone` is usually several screenshots side by side, which is still a " +
      "phone entry. Retag the entry, or widen the range in `device_types`.",
  );
  out.push("");
  out.push(
    table(
      ["Slug", "Claims", "Ratio", "Range for that device"],
      // Worst disagreement first: the top of this table is where a look at the
      // picture is most likely to change something.
      [...r.deviceShapeDisagrees]
        .sort((a, b) => outsideBy(b) - outsideBy(a))
        .map((d) => [
          `\`${d.slug}\``,
          d.device,
          d.ratio.toFixed(3),
          `${d.min.toFixed(2)}–${d.max.toFixed(2)}`,
        ]),
    ),
  );

  out.push("### Relations that resolved to nothing");
  out.push("");
  out.push(
    table(
      ["Entry", "Named a related entry titled"],
      r.unresolvedRelations.map((u) => [`\`${u.slug}\``, u.title]),
    ),
  );

  out.push("### Body text kept as description");
  out.push("");
  out.push(
    "Legacy markdown bodies, mostly attribution. Move them if `description` should stay reserved for the vision model.",
  );
  out.push("");
  out.push(list(r.bodyTextPreserved.map((s) => `\`${s}\``)));

  out.push("### Images that disagreed between the two copies");
  out.push("");
  out.push("The directory copy was used.");
  out.push("");
  out.push(
    table(
      ["Slug", "Directory", "Flat"],
      r.imageConflicts.map((c) => [
        `\`${c.slug}\``,
        c.directoryHash.slice(0, 12),
        c.flatHash.slice(0, 12),
      ]),
    ),
  );

  out.push("## Applied automatically");
  out.push("");

  out.push(`### Device derived from aspect ratio (${r.derivedDeviceFrom.length})`);
  out.push("");
  out.push(
    table(
      ["Slug", "Ratio", "Chose"],
      r.derivedDeviceFrom.map((d) => [
        `\`${d.slug}\``,
        d.ratio.toFixed(3),
        d.chose,
      ]),
    ),
  );

  out.push(`### Device set by hand (${r.deviceSetByHand.length})`);
  out.push("");
  out.push(
    "Frontmatter `device`, written by `scripts/apply-decisions.ts` from a triage " +
      "session. No tag or ratio was consulted, and these are excluded from the " +
      "shape-disagreement list above.",
  );
  out.push("");
  out.push(
    table(
      ["Slug", "Device"],
      r.deviceSetByHand.map((d) => [`\`${d.slug}\``, d.device]),
    ),
  );

  out.push(`### OS left blank (${r.osLeftBlank.length})`);
  out.push("");
  out.push(
    "No legacy tag named an operating system. Left null for the vision backfill in spec 02 rather than guessed.",
  );
  out.push("");
  out.push(list(r.osLeftBlank.map((s) => `\`${s}\``)));

  out.push(`### Tags dropped (${r.droppedTags.length})`);
  out.push("");
  out.push(
    table(
      ["Slug", "Raw tag", "Reason"],
      r.droppedTags.map((d) => [`\`${d.slug}\``, `\`${d.raw}\``, d.reason]),
    ),
  );

  out.push("## Corpus housekeeping");
  out.push("");
  out.push(
    `- Duplicate flat files skipped: **${r.skippedDuplicateFiles.length}**`,
  );
  out.push(`- Empty directories: **${r.emptyDirectories.length}**`);
  out.push(`- Images that could not be read: **${r.missingImages.length}**`);
  out.push("");
  out.push(list(r.missingImages.map((s) => `\`${s}\``)));

  return out.join("\n");
}
