/**
 * Node-only half of the migration: turns `content/states/` into `LegacyEntry`
 * values.
 *
 * Deliberately contains no D1 or R2 logic. It uses `fs`, `crypto` and `sharp`,
 * none of which exist in workerd, so importing this module from a Workers-pool
 * test would fail at load. The decisions worth testing live in `dedupe.ts` and
 * `classify.ts`, which are pure; what remains here is glue whose correctness
 * the dry-run report makes visible.
 */

import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import sharp from "sharp";
import { resolveCandidates, type Candidate, type Resolution } from "./dedupe";
import type { LegacyEntry } from "./types";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp"]);

function isImage(filename: string): boolean {
  return IMAGE_EXTENSIONS.has(path.extname(filename).toLowerCase());
}

async function hashFile(filePath: string): Promise<string> {
  return createHash("sha256")
    .update(await readFile(filePath))
    .digest("hex");
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Walks the corpus and resolves its two storage forms into one candidate per
 * slug. Hashes every image, since deciding which duplicate to discard is only
 * safe if the copies are known to agree.
 */
export async function discoverCorpus(dir: string): Promise<Resolution> {
  const names = await readdir(dir, { withFileTypes: true });
  const candidates: Candidate[] = [];

  for (const entry of names) {
    if (entry.isDirectory()) {
      const slug = entry.name;
      const inner = await readdir(path.join(dir, slug));
      const markdown = inner.includes("index.md")
        ? path.join(dir, slug, "index.md")
        : null;

      // Frontmatter names the image, and some directories hold several — one
      // holds four. Picking the first on disk silently imports the wrong
      // picture, so the declared name wins and the first image is only a
      // fallback for orphans, which have no frontmatter to consult.
      let imageName: string | null = null;
      if (markdown) {
        const declared = String(
          matter(await readFile(markdown, "utf8")).data.image ?? "",
        ).replace(/^\.\//, "");
        if (declared && inner.includes(declared)) imageName = declared;
      }
      imageName ??= inner.find(isImage) ?? null;
      const imagePath = imageName ? path.join(dir, slug, imageName) : null;

      candidates.push({
        slug,
        form: "directory",
        markdownPath: markdown,
        imagePath,
        imageHash: imagePath ? await hashFile(imagePath) : null,
      });
      continue;
    }

    if (!entry.isFile() || path.extname(entry.name) !== ".md") continue;

    const slug = path.basename(entry.name, ".md");
    const markdownPath = path.join(dir, entry.name);
    // A flat entry's image sits at the top level, named by its frontmatter.
    const raw = await readFile(markdownPath, "utf8");
    const declared = String(matter(raw).data.image ?? "").replace(/^\.\//, "");
    const imagePath = declared ? path.join(dir, declared) : null;
    const imageFound = imagePath && (await exists(imagePath)) ? imagePath : null;

    candidates.push({
      slug,
      form: "flat",
      markdownPath,
      imagePath: imageFound,
      imageHash: imageFound ? await hashFile(imageFound) : null,
    });
  }

  return resolveCandidates(candidates);
}

/**
 * Reads one resolved candidate into a `LegacyEntry`, measuring the image so the
 * gallery never has to. Returns null only when the image cannot be measured,
 * which the caller reports rather than guessing dimensions for.
 */
export async function readEntry(
  candidate: Candidate,
): Promise<LegacyEntry | null> {
  if (!candidate.imagePath) return null;

  const bytes = await readFile(candidate.imagePath);
  let width: number | undefined;
  let height: number | undefined;
  try {
    const meta = await sharp(bytes).metadata();
    width = meta.width;
    height = meta.height;
  } catch {
    return null;
  }
  if (!width || !height) return null;

  const filename = path.basename(candidate.imagePath);
  const image: LegacyEntry["image"] = {
    filename,
    extension: path.extname(filename).slice(1).toLowerCase(),
    bytes: new Uint8Array(bytes),
    width,
    height,
    byteSize: bytes.byteLength,
  };

  // An orphan: an image with no frontmatter beside it. Craig's call is to import
  // these as drafts so the pictures survive and can be titled later, rather than
  // publish 17 untitled rows or lose them.
  if (!candidate.markdownPath) {
    const stats = await stat(candidate.imagePath);
    return {
      legacySlug: candidate.slug,
      sourcePath: candidate.imagePath,
      title: candidate.slug,
      // No date exists to read. The file's mtime is the only honest answer, and
      // the report names every entry this fired for.
      publishedAt: stats.mtime.toISOString(),
      appName: null,
      appUrl: null,
      rawTags: [],
      relatedTitles: [],
      redirectPath: null,
      bodyText: null,
      status: "draft",
      image,
    };
  }

  const parsed = matter(await readFile(candidate.markdownPath, "utf8"));
  const data = parsed.data as Record<string, unknown>;
  const body = parsed.content.trim();

  return {
    legacySlug: candidate.slug,
    sourcePath: candidate.markdownPath,
    title: String(data.title ?? candidate.slug).trim(),
    // gray-matter parses `date` into a Date object; SQLite cannot bind one.
    publishedAt: toIso(data.date),
    appName: optionalString(data.product),
    appUrl: optionalString(data.referral),
    rawTags: Array.isArray(data.tags) ? data.tags.map((t) => String(t)) : [],
    relatedTitles: Array.isArray(data.related)
      ? data.related.map((t) => String(t).trim()).filter(Boolean)
      : [],
    redirectPath: optionalString(data.redirect),
    bodyText: body || null,
    status: "published",
    image,
  };
}

function optionalString(value: unknown): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed || null;
}

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime())
    ? new Date(0).toISOString()
    : parsed.toISOString();
}
