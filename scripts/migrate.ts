import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { glob } from "glob";

const API_BASE = process.env.API_BASE ?? "http://localhost:4321/_emdash/api";
const CONTENT_DIR = path.resolve("content/states");

interface FrontMatter {
  title: string;
  date: string;
  image: string;
  tags?: string[];
  referral?: string;
}

function classifyTags(oldTags: string[]): {
  device_type: string;
  platform?: string;
  tags: string[];
} {
  const lower = oldTags.map((t) => t.toLowerCase());

  let device_type = "mobile";
  if (lower.includes("desktop")) device_type = "desktop";
  else if (lower.includes("tablet")) device_type = "tablet";
  else if (lower.includes("tv")) device_type = "tv";
  else if (lower.includes("watch")) device_type = "watch";
  else if (lower.includes("game")) device_type = "game";

  let platform: string | undefined;
  if (lower.includes("ios")) platform = "ios";
  else if (lower.includes("android")) platform = "android";
  else if (lower.includes("macos")) platform = "macos";
  else if (lower.includes("windows")) platform = "windows";
  else if (lower.includes("web")) platform = "web";

  const devicePlatformTags = [
    "mobile", "desktop", "tablet", "tv", "watch", "game",
    "ios", "android", "macos", "windows", "web",
  ];

  const validTags = [
    "onboarding", "error", "no-results", "no-content", "first-run",
    "permissions", "location", "illustration", "text-only", "success",
    "upgrade", "connection", "search", "notification", "empty-cart", "empty-inbox",
  ];

  const tags = lower.filter(
    (t) => !devicePlatformTags.includes(t) && validTags.includes(t)
  );

  return { device_type, platform, tags };
}

function slugFromDir(dirName: string): string {
  return dirName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function uploadImage(imagePath: string): Promise<{ id: string; url: string } | null> {
  if (!fs.existsSync(imagePath)) {
    console.warn(`  Image not found: ${imagePath}`);
    return null;
  }

  const fileBuffer = fs.readFileSync(imagePath);
  const fileName = path.basename(imagePath);
  const blob = new Blob([fileBuffer]);
  const formData = new FormData();
  formData.append("file", blob, fileName);

  const res = await fetch(`${API_BASE}/media`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    console.warn(`  Image upload failed: ${res.status}`);
    return null;
  }

  return res.json();
}

async function createEntry(data: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${API_BASE}/collections/states/entries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create entry failed (${res.status}): ${text}`);
  }
}

async function main() {
  const mdFiles = await glob("*/index.md", { cwd: CONTENT_DIR });
  console.log(`Found ${mdFiles.length} entries to migrate.`);

  let success = 0;
  let failed = 0;

  for (const relPath of mdFiles) {
    const fullPath = path.join(CONTENT_DIR, relPath);
    const dirName = path.dirname(relPath);
    const raw = fs.readFileSync(fullPath, "utf-8");
    const { data: fm } = matter(raw) as { data: FrontMatter };

    console.log(`Migrating: ${fm.title || dirName}`);

    const slug = slugFromDir(dirName);
    const { device_type, platform, tags } = classifyTags(fm.tags ?? []);

    const imageName = fm.image?.replace("./", "");
    let screenshot = null;
    if (imageName) {
      const imagePath = path.join(CONTENT_DIR, dirName, imageName);
      screenshot = await uploadImage(imagePath);
    }

    if (!screenshot) {
      console.warn(`  Skipping (no image): ${dirName}`);
      failed++;
      continue;
    }

    try {
      await createEntry({
        title: fm.title || dirName,
        slug,
        screenshot,
        device_type,
        platform,
        tags,
        app_url: fm.referral,
        captured_at: fm.date || new Date().toISOString(),
        focal_x: 50,
        focal_y: 50,
        status: "published",
      });
      success++;
    } catch (err) {
      console.error(`  FAILED: ${err}`);
      failed++;
    }
  }

  console.log(`\nMigration complete: ${success} succeeded, ${failed} failed.`);
}

main();
