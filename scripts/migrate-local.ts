import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { glob } from "glob";
import Database from "better-sqlite3";
import { ulid } from "ulidx";
import { execSync } from "child_process";

/**
 * Direct SQLite migration — bypasses the API auth requirement.
 * Copies images to the local uploads directory and inserts records
 * directly into the EMDash SQLite database.
 *
 * Run: npm run migrate:local
 */

const DB_PATH = path.resolve("data.db");
const CONTENT_DIR = path.resolve("content/states");
const UPLOADS_DIR = path.resolve("uploads");

interface FrontMatter {
  title: string;
  date: string;
  image: string;
  tags?: string[];
  referral?: string;
}

function classifyTags(oldTags: string[]): {
  device_type: string;
  platform: string | null;
  tags: string[];
} {
  const lower = oldTags.map((t) => t.toLowerCase());

  let device_type = "mobile";
  if (lower.includes("desktop")) device_type = "desktop";
  else if (lower.includes("tablet")) device_type = "tablet";
  else if (lower.includes("tv")) device_type = "tv";
  else if (lower.includes("watch")) device_type = "watch";
  else if (lower.includes("game")) device_type = "game";

  let platform: string | null = null;
  if (lower.includes("ios")) platform = "ios";
  else if (lower.includes("android")) platform = "android";
  else if (lower.includes("macos")) platform = "macos";
  else if (lower.includes("windows")) platform = "windows";
  else if (lower.includes("web")) platform = "web";

  const skipTags = new Set([
    "mobile", "desktop", "tablet", "tv", "watch", "game",
    "ios", "android", "macos", "windows", "web",
  ]);

  const validTags = new Set([
    "onboarding", "error", "no-results", "no-content", "first-run",
    "permissions", "location", "illustration", "text-only", "success",
    "upgrade", "connection", "search", "notification", "empty-cart", "empty-inbox",
  ]);

  const tags = lower.filter((t) => !skipTags.has(t) && validTags.has(t));

  return { device_type, platform, tags };
}

function slugFromDir(dirName: string): string {
  return dirName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getMimeType(ext: string): string {
  const map: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  return map[ext.toLowerCase()] ?? "application/octet-stream";
}

async function main() {
  // Ensure uploads directory exists
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  const insertMedia = db.prepare(`
    INSERT INTO media (id, filename, mime_type, size, storage_key, created_at, status)
    VALUES (?, ?, ?, ?, ?, datetime('now'), 'ready')
  `);

  const insertEntry = db.prepare(`
    INSERT INTO ec_states (id, slug, status, created_at, updated_at, published_at, title, screenshot, device_type, platform, tags, focal_x, focal_y, captured_at, app_url)
    VALUES (?, ?, 'published', ?, ?, ?, ?, ?, ?, ?, ?, 50, 50, ?, ?)
  `);

  const mdFiles = await glob("*/index.md", { cwd: CONTENT_DIR });
  console.log(`Found ${mdFiles.length} entries to migrate.`);

  let success = 0;
  let failed = 0;

  const migrateAll = db.transaction(() => {
    for (const relPath of mdFiles) {
      const fullPath = path.join(CONTENT_DIR, relPath);
      const dirName = path.dirname(relPath);
      const raw = fs.readFileSync(fullPath, "utf-8");
      const { data: fm } = matter(raw) as unknown as { data: FrontMatter };

      const title = fm.title || dirName;
      const slug = slugFromDir(dirName);
      const { device_type, platform, tags } = classifyTags(fm.tags ?? []);

      // Copy image
      const imageName = fm.image?.replace("./", "");
      if (!imageName) {
        console.warn(`  Skipping (no image): ${dirName}`);
        failed++;
        continue;
      }

      const imagePath = path.join(CONTENT_DIR, dirName, imageName);
      if (!fs.existsSync(imagePath)) {
        console.warn(`  Skipping (image not found): ${imagePath}`);
        failed++;
        continue;
      }

      const mediaId = ulid();
      const ext = path.extname(imageName);
      const storageKey = `${mediaId}${ext}`;
      const destPath = path.join(UPLOADS_DIR, storageKey);
      const fileSize = fs.statSync(imagePath).size;

      // Copy image to uploads dir
      fs.copyFileSync(imagePath, destPath);

      // Insert media record
      insertMedia.run(
        mediaId,
        imageName,
        getMimeType(ext),
        fileSize,
        storageKey
      );

      // Build screenshot JSON reference
      const screenshot = JSON.stringify({
        id: mediaId,
        url: `/_emdash/api/media/file/${storageKey}`,
        alt: title,
      });

      const entryId = ulid();
      const capturedAt = fm.date ? String(fm.date) : new Date().toISOString();
      const now = new Date().toISOString();
      const appUrl = typeof fm.referral === "string" ? fm.referral : null;

      try {
        insertEntry.run(
          entryId,
          slug,
          now,
          now,
          now,
          title,
          screenshot,
          device_type || "mobile",
          platform || null,
          JSON.stringify(tags || []),
          capturedAt,
          appUrl
        );
        success++;
        if (success % 25 === 0) console.log(`  ${success} migrated...`);
      } catch (err) {
        console.error(`  FAILED (${title}): ${err}`);
        failed++;
      }
    }
  });

  migrateAll();
  db.close();

  console.log(`\nMigration complete: ${success} succeeded, ${failed} failed.`);
}

main();
