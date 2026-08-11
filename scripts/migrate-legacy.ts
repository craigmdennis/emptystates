/**
 * Runs the legacy migration.
 *
 *   npx tsx scripts/migrate-legacy.ts --dry-run   # decide nothing, report everything
 *   npx tsx scripts/migrate-legacy.ts             # write to the local D1 and R2
 *
 * This is the only place the two halves meet. `getPlatformProxy` hands a plain
 * Node process the same D1 and R2 bindings a Worker would get — reading the
 * same local state `wrangler d1 migrations apply --local` writes — so the
 * Node-only reader and the binding-only importer can run in one process
 * without either learning about the other's runtime.
 */

import { writeFile } from "node:fs/promises";
import { getPlatformProxy } from "wrangler";
import { importEntries } from "../src/migrate/import";
import { discoverCorpus, readEntry } from "../src/migrate/read";
import { formatReport } from "../src/migrate/report";
import type { LegacyEntry } from "../src/migrate/types";

const CORPUS_DIR = "content/states";
const REPORT_PATH = "migration-report.md";

const dryRun = process.argv.includes("--dry-run");

const { env, dispose } = await getPlatformProxy<{
  DB: D1Database;
  MEDIA: R2Bucket;
}>({
  // Pinned off rather than left to the default, which is `true`. Local-only is
  // the whole safety property of a dry run, and it should not become untrue
  // because someone later marks a binding remote in wrangler.jsonc. The remote
  // import is Task 12's job and needs that config change made deliberately.
  remoteBindings: false,
});

try {
  console.log(
    `Reading ${CORPUS_DIR} — ${dryRun ? "dry run" : "local write"}`,
  );

  const resolution = await discoverCorpus(CORPUS_DIR);
  console.log(
    `  ${resolution.keep.length} entries, ${resolution.skipped.length} duplicate files skipped, ` +
      `${resolution.orphans.length} orphaned images`,
  );

  const missingImages: string[] = [];

  // Streamed rather than collected: 252 originals held in memory at once is
  // needless, and the importer only ever looks at one entry.
  async function* stream(): AsyncGenerator<LegacyEntry> {
    for (const candidate of resolution.keep) {
      const entry = await readEntry(candidate);
      if (!entry) {
        missingImages.push(candidate.slug);
        continue;
      }
      yield entry;
    }
  }

  const report = await importEntries({
    db: env.DB,
    bucket: env.MEDIA,
    entries: stream(),
    dryRun,
  });

  // Facts the importer never saw, because they were settled before it ran.
  report.skippedDuplicateFiles = resolution.skipped.map((s) => s.path);
  report.imageConflicts = resolution.conflicts;
  report.emptyDirectories = resolution.empty;
  report.missingImages = missingImages;

  await writeFile(REPORT_PATH, formatReport(report, dryRun), "utf8");

  console.log("");
  console.log(`  imported            ${report.imported} (${report.drafts} drafts)`);
  console.log(`  unmapped tags       ${report.unmappedTags.length}`);
  console.log(`  slugs changed       ${report.slugChanged.length}`);
  console.log(`  device derived      ${report.derivedDeviceFrom.length}`);
  console.log(`  ratio unmatched     ${report.aspectOutsideAllRanges.length}`);
  console.log(`  os left blank       ${report.osLeftBlank.length}`);
  console.log(`  redirects           ${report.redirectsWritten}`);
  console.log(`  relations           ${report.relationsWritten}`);
  console.log(`  relations unresolved ${report.unresolvedRelations.length}`);
  console.log("");
  console.log(`Wrote ${REPORT_PATH}. Read it before running without --dry-run.`);
} finally {
  await dispose();
}
