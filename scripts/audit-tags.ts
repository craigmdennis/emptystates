/**
 * Runs the tag classifier over the whole legacy corpus and reports what it
 * cannot map. This is the gate described in the plan: every unmapped tag must
 * be either added to the classifier or consciously dropped before the real
 * migration runs.
 *
 *   npx tsx scripts/audit-tags.ts
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { classifyTag } from "../src/migrate/classify.ts";

const ROOT = new URL("../content/states", import.meta.url).pathname;

const files: string[] = [];
for (const entry of readdirSync(ROOT)) {
  const p = join(ROOT, entry);
  if (statSync(p).isDirectory()) {
    const idx = join(p, "index.md");
    try {
      statSync(idx);
      files.push(idx);
    } catch {
      /* directory without an index.md holds only the image */
    }
  } else if (entry.endsWith(".md")) {
    files.push(p);
  }
}

const counts: Record<string, number> = {};
const unmapped = new Map<string, number>();
const droppedTitles = new Set<string>();

for (const f of files) {
  const { data } = matter(readFileSync(f, "utf8"));
  const title = String(data.title ?? "");
  const tags: unknown[] = Array.isArray(data.tags) ? data.tags : [];
  for (const t of tags) {
    const v = classifyTag(String(t ?? ""), title);
    counts[v.kind] = (counts[v.kind] ?? 0) + 1;
    if (v.kind === "unmapped") unmapped.set(v.raw, (unmapped.get(v.raw) ?? 0) + 1);
    if (v.kind === "drop" && (v.reason === "is-title" || v.reason === "looks-like-title")) {
      droppedTitles.add(String(t));
    }
  }
}

console.log(`files scanned: ${files.length}`);
console.log("verdicts:", counts);
console.log(`\ntitles removed from tags (${droppedTitles.size} distinct):`);
for (const t of [...droppedTitles].slice(0, 6)) console.log("  -", t);
console.log(`\nUNMAPPED (${unmapped.size} distinct) — resolve every line before migrating:`);
for (const [k, n] of [...unmapped].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(3)}x  ${k}`);
}
