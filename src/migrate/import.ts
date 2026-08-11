/**
 * Writes `LegacyEntry` values into D1 and R2.
 *
 * Runtime-agnostic on purpose: it takes bindings and already-read entries, so
 * it runs inside a Worker, inside the Workers test pool, and inside a Node CLI
 * holding a `getPlatformProxy()` env. Nothing here touches `fs` or `sharp` —
 * that is `read.ts`, which cannot run in workerd.
 *
 * Every place this could quietly invent data instead records it on the report:
 * a tag it cannot map, a device it had to derive, an OS it had to assume, a
 * slug it had to change, a relation that resolved to nothing.
 */

import { ulid } from "ulidx";
import { classifyTag } from "./classify";
import { writeFtsRow } from "../db/fts";
import { dedupeSlug, isCleanSlug, slugify } from "../lib/slug";
import { emptyReport, type MigrationReport } from "./report";
import type { LegacyEntry } from "./types";

export type ImportOptions = {
  db: D1Database;
  bucket: R2Bucket;
  entries: Iterable<LegacyEntry> | AsyncIterable<LegacyEntry>;
  /** Compute and report everything; write nothing. */
  dryRun?: boolean;
  /** Injectable so tests are deterministic. */
  newId?: () => string;
};

type DeviceRange = {
  slug: string;
  min_ratio: number | null;
  max_ratio: number | null;
};

/**
 * Only ever used when a ratio matches no configured range at all. There is no
 * OS equivalent: device type is always recoverable from dimensions, so a
 * fallback is a reasoned guess, whereas an OS fallback would be an invention.
 */
const FALLBACK_DEVICE = { wide: "desktop", tall: "phone" } as const;

export async function importEntries(
  opts: ImportOptions,
): Promise<MigrationReport> {
  const { db, bucket, entries, dryRun = false, newId = ulid } = opts;
  const report = emptyReport();

  const { results: ranges } = await db
    .prepare(
      `SELECT slug, min_ratio, max_ratio FROM device_types
       WHERE is_active = 1 ORDER BY sort_order`,
    )
    .all<DeviceRange>();

  // Seeded from the database, not just this run, so a re-run cannot collide
  // with rows a previous run already wrote.
  const { results: existing } = await db
    .prepare("SELECT slug FROM states")
    .all<{ slug: string }>();
  const taken = new Set(existing.map((r) => r.slug));

  const tagIds = new Map<string, number>();
  const idByTitle = new Map<string, string>();
  const pendingRelations: { id: string; slug: string; titles: string[] }[] = [];
  const unmapped = new Set<string>();
  const now = new Date().toISOString();

  for await (const entry of entries) {
    const id = newId();

    // --- Classify the legacy tag soup into its three real dimensions --------
    let device: string | null = null;
    let os: string | null = null;
    const tagSlugs: string[] = [];

    for (const raw of entry.rawTags) {
      const verdict = classifyTag(raw, entry.title);
      switch (verdict.kind) {
        case "device":
          device ??= verdict.value;
          break;
        case "os":
          os ??= verdict.value;
          break;
        case "tag":
          if (!tagSlugs.includes(verdict.value)) tagSlugs.push(verdict.value);
          break;
        case "drop":
          report.droppedTags.push({
            slug: entry.legacySlug,
            raw,
            reason: verdict.reason,
          });
          break;
        case "unmapped":
          unmapped.add(verdict.raw);
          break;
      }
    }

    const ratio = entry.image.width / entry.image.height;

    if (!device) {
      const match = ranges.find(
        (r) =>
          r.min_ratio != null &&
          r.max_ratio != null &&
          ratio >= r.min_ratio &&
          ratio <= r.max_ratio,
      );
      if (match) {
        device = match.slug;
        report.derivedDeviceFrom.push({
          slug: entry.legacySlug,
          ratio,
          chose: match.slug,
        });
      } else {
        device = ratio >= 1 ? FALLBACK_DEVICE.wide : FALLBACK_DEVICE.tall;
        report.aspectOutsideAllRanges.push({
          slug: entry.legacySlug,
          ratio,
          fellBackTo: device,
        });
      }
    }

    // Left blank rather than defaulted. 134 of the legacy phones have no OS
    // tag, and calling them 'web' would be a wrong answer behind the OS filter
    // rather than a missing one.
    if (!os) report.osLeftBlank.push(entry.legacySlug);

    // --- Slug: keep the legacy URL, or replace it and redirect --------------
    // The legacy directory name IS the live URL — Gatsby derived /s/<name>/
    // from it — so changing one without a redirect is a 404 for a real visitor.
    let slug: string;
    let redirectFromLegacy: string | null = null;
    if (isCleanSlug(entry.legacySlug) && !taken.has(entry.legacySlug)) {
      slug = entry.legacySlug;
    } else {
      slug = dedupeSlug(
        slugify(entry.title, entry.appName) ||
          slugify(entry.legacySlug) ||
          entry.legacySlug.toLowerCase(),
        taken,
      );
      if (slug !== entry.legacySlug) {
        report.slugChanged.push({ from: entry.legacySlug, to: slug });
        redirectFromLegacy = `/s/${entry.legacySlug}`;
      }
    }
    taken.add(slug);

    const r2Key = `originals/${id}.${entry.image.extension}`;
    if (entry.bodyText) report.bodyTextPreserved.push(entry.legacySlug);

    if (!dryRun) {
      await bucket.put(r2Key, entry.image.bytes);

      for (const tagSlug of tagSlugs) {
        if (!tagIds.has(tagSlug)) {
          tagIds.set(tagSlug, await upsertTag(db, tagSlug));
        }
      }

      const statements: D1PreparedStatement[] = [
        db
          .prepare(
            `INSERT INTO states
               (id, slug, title, app_name, app_url, device_type, os, r2_key,
                width, height, aspect_ratio, byte_size, description, status,
                is_legacy, published_at, created_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)`,
          )
          .bind(
            id,
            slug,
            entry.title,
            entry.appName,
            entry.appUrl,
            device,
            os,
            r2Key,
            entry.image.width,
            entry.image.height,
            ratio,
            entry.image.byteSize,
            entry.bodyText,
            entry.status,
            entry.publishedAt,
            now,
          ),
      ];

      for (const tagSlug of tagSlugs) {
        statements.push(
          db
            .prepare(
              "INSERT OR IGNORE INTO state_tags (state_id, tag_id) VALUES (?, ?)",
            )
            .bind(id, tagIds.get(tagSlug)!),
        );
      }

      // Both kinds of inbound path: the Tumblr URL the entry carried in its
      // frontmatter, and the /s/<old-name> this import is about to retire.
      for (const from of [entry.redirectPath, redirectFromLegacy]) {
        if (!from) continue;
        statements.push(
          db
            .prepare(
              `INSERT OR IGNORE INTO state_redirects (from_path, state_id, created_at)
               VALUES (?, ?, ?)`,
            )
            .bind(from, id, now),
        );
        report.redirectsWritten++;
      }

      // Same batch as the write that made it stale — the constraint the schema
      // asks for, enforced rather than remembered.
      statements.push(
        ...writeFtsRow(db, {
          stateId: id,
          title: entry.title,
          appName: entry.appName,
          tags: tagSlugs.join(" "),
          description: entry.bodyText,
        }),
      );

      await db.batch(statements);
    } else {
      if (entry.redirectPath) report.redirectsWritten++;
      if (redirectFromLegacy) report.redirectsWritten++;
    }

    idByTitle.set(normalizeTitle(entry.title), id);
    if (entry.relatedTitles.length) {
      pendingRelations.push({
        id,
        slug,
        titles: entry.relatedTitles,
      });
    }

    report.imported++;
    if (entry.status === "draft") report.drafts++;
  }

  // --- Pass two: relations, once every title has an id ---------------------
  const relationStatements: D1PreparedStatement[] = [];
  for (const pending of pendingRelations) {
    for (const title of pending.titles) {
      const targetId = idByTitle.get(normalizeTitle(title));
      if (!targetId || targetId === pending.id) {
        report.unresolvedRelations.push({ slug: pending.slug, title });
        continue;
      }
      report.relationsWritten++;
      relationStatements.push(
        db
          .prepare(
            `INSERT OR IGNORE INTO state_relations (state_id, related_state_id)
             VALUES (?, ?)`,
          )
          .bind(pending.id, targetId),
      );
    }
  }
  if (!dryRun && relationStatements.length) {
    await db.batch(relationStatements);
  }

  report.unmappedTags = [...unmapped].sort();
  return report;
}

async function upsertTag(db: D1Database, slug: string): Promise<number> {
  const row = await db
    .prepare(
      `INSERT INTO tags (slug, label) VALUES (?, ?)
       ON CONFLICT(slug) DO UPDATE SET label = label
       RETURNING id`,
    )
    .bind(slug, humanize(slug))
    .first<{ id: number }>();
  return row!.id;
}

function humanize(slug: string): string {
  const words = slug.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Relations are stored as titles; matching has to survive case and spacing. */
function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}
