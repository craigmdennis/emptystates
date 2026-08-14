/**
 * Applies a triage session to the corpus.
 *
 *   npx tsx scripts/apply-decisions.ts --dry-run          # print the plan
 *   npx tsx scripts/apply-decisions.ts                    # do it
 *   npx tsx scripts/apply-decisions.ts path/to/file.json
 *
 * Consumes the file `docs/device-triage.html` exports. A `device` decision adds
 * a `device:` line to the entry's frontmatter, which the importer prefers over
 * anything its tags imply. A `delete` decision removes the entry's directory,
 * its flat twin and the image that twin declared.
 *
 * Nothing here touches D1. The corpus is the source of truth, so applying a
 * session means editing `content/states/` and running the migration again.
 * Everything it removes is tracked in git, so a deletion is recoverable with
 * `git checkout -- content/states`.
 */

import { readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { getPlatformProxy } from "wrangler";
import { setDeviceInFrontmatter } from "../src/migrate/decisions";
import { CORPUS_DIR } from "./corpus";

type Decision =
  | { slug: string; dir: string; action: "device"; device: string; was: string }
  | { slug: string; dir: string; action: "delete"; was: string };

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const file = args.find((a) => !a.startsWith("--")) ?? "device-decisions.json";

async function exists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

const parsed = JSON.parse(await readFile(file, "utf8")) as {
  version?: number;
  decisions?: Decision[];
};
const decisions = parsed.decisions ?? [];
if (decisions.length === 0) {
  console.log(`${file} lists no decisions. Nothing to do.`);
  process.exit(0);
}

const { env, dispose } = await getPlatformProxy<{ DB: D1Database }>({
  remoteBindings: false,
});

try {
  // The taxonomy is a table, so the valid device set is read rather than
  // hardcoded. A typo in the decisions file would otherwise fail much later,
  // against a foreign key, halfway through an import.
  const { results } = await env.DB.prepare(
    "SELECT slug FROM device_types WHERE is_active = 1",
  ).all<{ slug: string }>();
  const valid = new Set(results.map((r) => r.slug));

  const problems: string[] = [];
  for (const d of decisions) {
    if (d.action === "device" && !valid.has(d.device)) {
      problems.push(`${d.slug}: '${d.device}' is not an active device type`);
    }
    if (!(await exists(path.join(CORPUS_DIR, d.dir)))) {
      problems.push(`${d.slug}: ${CORPUS_DIR}/${d.dir} does not exist`);
    }
  }
  if (problems.length) {
    console.error(`Refusing to apply ${file}:`);
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }

  let retagged = 0;
  let deleted = 0;
  const removedPaths: string[] = [];

  for (const d of decisions) {
    const dir = path.join(CORPUS_DIR, d.dir);
    const flat = `${dir}.md`;

    if (d.action === "device") {
      // Both storage forms are edited. `dedupe.ts` discards the flat copy in
      // favour of the directory, but it compares them first, and leaving the
      // pair disagreeing would plant a conflict for a later reader.
      for (const target of [path.join(dir, "index.md"), flat]) {
        if (!(await exists(target))) continue;
        const source = await readFile(target, "utf8");
        const next = setDeviceInFrontmatter(source, d.device);
        if (!dryRun) await writeFile(target, next, "utf8");
      }
      console.log(`  device  ${d.slug}: ${d.was} -> ${d.device}`);
      retagged++;
      continue;
    }

    // The flat twin names its image at the top level of the corpus, so read it
    // before removing the file that points at it.
    const loose: string[] = [];
    if (await exists(flat)) {
      const declared = String(
        matter(await readFile(flat, "utf8")).data.image ?? "",
      ).replace(/^\.\//, "");
      if (declared) loose.push(path.join(CORPUS_DIR, declared));
    }

    const inner = await readdir(dir);
    for (const target of [dir, flat, ...loose]) {
      if (!(await exists(target))) continue;
      if (!dryRun) await rm(target, { recursive: true, force: true });
      removedPaths.push(target);
    }
    console.log(`  delete  ${d.slug} (was ${d.was}, ${inner.length} files)`);
    deleted++;
  }

  console.log("");
  console.log(`  retagged  ${retagged}`);
  console.log(`  deleted   ${deleted} entries, ${removedPaths.length} paths`);
  console.log("");
  if (dryRun) {
    console.log("Dry run. Nothing was written. Drop --dry-run to apply.");
  } else {
    console.log("Applied. Re-run the migration to see it in D1:");
    console.log("  rm -rf .wrangler/state/v3/d1");
    console.log("  npx wrangler d1 migrations apply emptystates-db --local");
    console.log("  npm run migrate:legacy");
  }
} finally {
  await dispose();
}
