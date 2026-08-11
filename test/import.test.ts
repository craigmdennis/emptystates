import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { it, expect, beforeEach } from "vitest";
import { importEntries } from "../src/migrate/import";
import type { LegacyEntry } from "../src/migrate/types";

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  // applyD1Migrations is a no-op after the first call, so each test clears the
  // rows it cares about rather than relying on a fresh database.
  for (const t of [
    "state_relations",
    "state_redirects",
    "state_tags",
    "states_fts",
    "tags",
    "states",
  ]) {
    await env.DB.prepare(`DELETE FROM ${t}`).run();
  }
  // R2 persists across tests in a file too, and the dry-run test asserts on an
  // empty bucket.
  const { objects } = await env.MEDIA.list();
  await Promise.all(objects.map((o) => env.MEDIA.delete(o.key)));
});

const IMAGE_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);

function entry(over: Partial<LegacyEntry> = {}): LegacyEntry {
  return {
    legacySlug: "no-content-in-plex",
    sourcePath: "content/states/no-content-in-plex/index.md",
    title: "No content in Plex",
    publishedAt: "2020-09-27T21:43:17.516Z",
    appName: "Plex",
    appUrl: null,
    rawTags: ["mobile", "android", "no-content", "widget", ""],
    relatedTitles: [],
    redirectPath: null,
    bodyText: null,
    status: "published",
    image: {
      filename: "shot.png",
      extension: "png",
      bytes: IMAGE_BYTES,
      width: 1080,
      height: 2160,
      byteSize: 6,
    },
    ...over,
  };
}

const run = (entries: LegacyEntry[], dryRun = false) =>
  importEntries({ db: env.DB, bucket: env.MEDIA, entries, dryRun });

it("imports an entry, splitting device, OS and tags", async () => {
  const report = await run([entry()]);
  expect(report.imported).toBe(1);

  const row = await env.DB.prepare(
    `SELECT slug, title, app_name, device_type, os, is_legacy, status,
            width, height, aspect_ratio, byte_size, r2_key
     FROM states`,
  ).first<any>();

  expect(row.device_type).toBe("phone");
  expect(row.os).toBe("android");
  expect(row.is_legacy).toBe(1);
  expect(row.status).toBe("published");
  expect(row.app_name).toBe("Plex");
  expect(row.width).toBe(1080);
  expect(row.aspect_ratio).toBeCloseTo(1080 / 2160, 5);
  expect(row.byte_size).toBe(6);
  expect(row.r2_key).toMatch(/^originals\/[0-9A-Z]{26}\.png$/);
});

it("keeps device and OS terms out of the tag table", async () => {
  await run([entry()]);
  const { results } = await env.DB.prepare(
    `SELECT t.slug FROM tags t JOIN state_tags st ON st.tag_id = t.id`,
  ).all<{ slug: string }>();
  const slugs = results.map((r) => r.slug);
  expect(slugs).toContain("no-content");
  expect(slugs).not.toContain("mobile");
  expect(slugs).not.toContain("android");
});

it("records unmapped tags in the report instead of inventing a mapping", async () => {
  const report = await run([entry()], true);
  expect(report.unmappedTags).toContain("widget");
  const { results } = await env.DB.prepare("SELECT slug FROM tags").all();
  expect(results).toHaveLength(0);
});

it("writes nothing to D1 or R2 on a dry run", async () => {
  const report = await run([entry()], true);
  expect(report.imported).toBe(1);
  const row = await env.DB.prepare("SELECT COUNT(*) AS n FROM states").first<{
    n: number;
  }>();
  expect(row?.n).toBe(0);
  expect((await env.MEDIA.list()).objects).toHaveLength(0);
});

it("puts the original in R2 under the key the row names", async () => {
  await run([entry()]);
  const row = await env.DB.prepare("SELECT r2_key FROM states").first<{
    r2_key: string;
  }>();
  const object = await env.MEDIA.get(row!.r2_key);
  expect(object).not.toBeNull();
  expect(new Uint8Array(await object!.arrayBuffer())).toEqual(IMAGE_BYTES);
});

// The one failure in this migration that costs real users.
it("reuses the legacy directory name so existing URLs survive", async () => {
  await run([entry({ legacySlug: "all-posts-read-in-feedly-for-android" })]);
  const row = await env.DB.prepare("SELECT slug FROM states").first<{
    slug: string;
  }>();
  expect(row?.slug).toBe("all-posts-read-in-feedly-for-android");
});

it("generates a slug when the legacy name is not URL-clean", async () => {
  const report = await run([
    entry({ legacySlug: "tumblr_n60wmfQ5b41rdf37to1_1280" }),
  ]);
  const row = await env.DB.prepare("SELECT slug FROM states").first<{
    slug: string;
  }>();
  expect(row?.slug).toBe("no-content-in-plex");
  expect(report.slugChanged).toEqual([
    { from: "tumblr_n60wmfQ5b41rdf37to1_1280", to: "no-content-in-plex" },
  ]);
});

// The legacy directory name is a live URL. Replacing it is only safe because
// the old path is kept as a redirect in the same batch.
it("redirects the retired legacy URL to the new slug", async () => {
  await run([entry({ legacySlug: "tumblr_n60wmfQ5b41rdf37to1_1280" })]);
  const row = await env.DB.prepare(
    `SELECT r.from_path, s.slug FROM state_redirects r
     JOIN states s ON s.id = r.state_id`,
  ).first<{ from_path: string; slug: string }>();
  expect(row?.from_path).toBe("/s/tumblr_n60wmfQ5b41rdf37to1_1280");
  expect(row?.slug).toBe("no-content-in-plex");
});

it("writes no redirect when the legacy URL is kept", async () => {
  await run([entry({ legacySlug: "no-content-in-plex" })]);
  const { results } = await env.DB.prepare(
    "SELECT * FROM state_redirects",
  ).all();
  expect(results).toHaveLength(0);
});

// Both legacy names are unusable, so both fall through to generation from the
// same title and app name — the only way two entries actually collide.
it("disambiguates two entries competing for one generated slug", async () => {
  await run([
    entry({ legacySlug: "tumblr_AAA_1280" }),
    entry({ legacySlug: "tumblr_BBB_1280" }),
  ]);
  const { results } = await env.DB.prepare(
    "SELECT slug FROM states ORDER BY slug",
  ).all<{ slug: string }>();
  expect(results.map((r) => r.slug)).toEqual([
    "no-content-in-plex",
    "no-content-in-plex-2",
  ]);
});

it("stores the legacy redirect path against the state", async () => {
  await run([entry({ redirectPath: "/post/162316071385/no-stories" })]);
  const row = await env.DB.prepare(
    `SELECT r.from_path, s.slug FROM state_redirects r
     JOIN states s ON s.id = r.state_id`,
  ).first<{ from_path: string; slug: string }>();
  expect(row?.from_path).toBe("/post/162316071385/no-stories");
  expect(row?.slug).toBe("no-content-in-plex");
});

it("imports an orphaned image as a draft with no tags", async () => {
  const report = await run([
    entry({
      legacySlug: "tumblr_n60wmfQ5b41rdf37to1_1280",
      title: "tumblr_n60wmfQ5b41rdf37to1_1280",
      status: "draft",
      appName: null,
      rawTags: [],
    }),
  ]);
  const row = await env.DB.prepare(
    "SELECT status, app_name FROM states",
  ).first<{ status: string; app_name: string | null }>();
  expect(row?.status).toBe("draft");
  expect(row?.app_name).toBeNull();
  expect(report.drafts).toBe(1);
});

it("derives device type from aspect ratio when no tag supplies one", async () => {
  const report = await run([
    entry({
      rawTags: ["no-content"],
      image: { ...entry().image, width: 2560, height: 1440 },
    }),
  ]);
  const row = await env.DB.prepare("SELECT device_type FROM states").first<{
    device_type: string;
  }>();
  expect(row?.device_type).toBe("desktop");
  expect(report.derivedDeviceFrom).toHaveLength(1);
  expect(report.derivedDeviceFrom[0].chose).toBe("desktop");
});

it("reports a ratio matching no device range rather than failing silently", async () => {
  const report = await run([
    entry({
      rawTags: ["no-content"],
      image: { ...entry().image, width: 3274, height: 1000 },
    }),
  ]);
  expect(report.aspectOutsideAllRanges).toHaveLength(1);
  const row = await env.DB.prepare("SELECT device_type FROM states").first<{
    device_type: string;
  }>();
  expect(row?.device_type).toBe("desktop");
});

// 134 legacy phones have no OS tag. Blank is missing; 'web' would be wrong.
it("leaves a missing OS blank and says so", async () => {
  const report = await run([entry({ rawTags: ["mobile", "no-content"] })]);
  const row = await env.DB.prepare("SELECT os FROM states").first<{
    os: string | null;
  }>();
  expect(row?.os).toBeNull();
  expect(report.osLeftBlank).toEqual(["no-content-in-plex"]);
});

it("resolves curated relations by title in a second pass", async () => {
  await run([
    entry({
      legacySlug: "figma-no-likes",
      title: "No likes in Figma Community",
      relatedTitles: ["Nothing published in Figma Community"],
    }),
    entry({
      legacySlug: "figma-nothing-publshed",
      title: "Nothing published in Figma Community",
    }),
  ]);

  const row = await env.DB.prepare(
    `SELECT a.slug AS src, b.slug AS dst
     FROM state_relations r
     JOIN states a ON a.id = r.state_id
     JOIN states b ON b.id = r.related_state_id`,
  ).first<{ src: string; dst: string }>();

  expect(row?.src).toBe("figma-no-likes");
  expect(row?.dst).toBe("figma-nothing-publshed");
});

it("reports a relation whose title matches nothing rather than guessing", async () => {
  const report = await run([
    entry({ relatedTitles: ["An entry that was deleted years ago"] }),
  ]);
  expect(report.unresolvedRelations).toEqual([
    {
      slug: "no-content-in-plex",
      title: "An entry that was deleted years ago",
    },
  ]);
  const { results } = await env.DB.prepare(
    "SELECT * FROM state_relations",
  ).all();
  expect(results).toHaveLength(0);
});

it("preserves legacy body text and lists every entry it did so for", async () => {
  const report = await run([
    entry({ bodyText: "Designed by [@MeneghiniEm](https://twitter.com/x)" }),
  ]);
  const row = await env.DB.prepare("SELECT description FROM states").first<{
    description: string;
  }>();
  expect(row?.description).toContain("MeneghiniEm");
  expect(report.bodyTextPreserved).toEqual(["no-content-in-plex"]);
});

it("writes one searchable row per state in the same batch", async () => {
  await run([entry()]);
  const row = await env.DB.prepare(
    "SELECT title, app_name, tags FROM states_fts",
  ).first<{ title: string; app_name: string; tags: string }>();
  expect(row?.title).toBe("No content in Plex");
  expect(row?.app_name).toBe("Plex");
  expect(row?.tags).toContain("no-content");
});

it("finds an imported entry through full-text search", async () => {
  await run([entry()]);
  const { results } = await env.DB.prepare(
    "SELECT state_id FROM states_fts WHERE states_fts MATCH ?",
  )
    .bind("plex")
    .all();
  expect(results).toHaveLength(1);
});
