import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { it, expect, beforeAll } from "vitest";

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});

it("creates every table", async () => {
  const { results } = await env.DB.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
  ).all<{ name: string }>();
  const names = results.map((r) => r.name);
  for (const t of [
    "device_types",
    "operating_systems",
    "tags",
    "states",
    "state_tags",
    "state_colors",
    "state_relations",
    "state_redirects",
    "submissions",
    "search_log",
    "layout_prefs",
  ]) {
    expect(names, `missing table ${t}`).toContain(t);
  }
});

it("seeds six device types including tv, console and watch", async () => {
  const { results } = await env.DB.prepare(
    "SELECT slug FROM device_types ORDER BY sort_order",
  ).all<{ slug: string }>();
  expect(results.map((r) => r.slug)).toEqual([
    "phone",
    "tablet",
    "desktop",
    "tv",
    "console",
    "watch",
  ]);
});

it("seeds six operating systems", async () => {
  const { results } = await env.DB.prepare(
    "SELECT slug FROM operating_systems ORDER BY sort_order",
  ).all<{ slug: string }>();
  expect(results.map((r) => r.slug)).toEqual([
    "ios",
    "android",
    "web",
    "macos",
    "windows",
    "linux",
  ]);
});

it("accepts a new device type without a migration", async () => {
  await env.DB.prepare(
    `INSERT INTO device_types (slug,label,sort_order,is_active,created_at)
     VALUES ('vr','VR headset',7,1,'2026-08-11T00:00:00Z')`,
  ).run();
  const row = await env.DB.prepare(
    "SELECT label FROM device_types WHERE slug='vr'",
  ).first<{ label: string }>();
  expect(row?.label).toBe("VR headset");
});

it("stores byte_size on states so the detail link can state it", async () => {
  const { results } = await env.DB.prepare(
    "SELECT name FROM pragma_table_info('states')",
  ).all<{ name: string }>();
  const cols = results.map((r) => r.name);
  expect(cols).toContain("byte_size");
  expect(cols).toContain("aspect_ratio");
  expect(cols).toContain("screen_text");
  expect(cols).toContain("is_legacy");
  // Focal points were dropped: neither view mode crops.
  expect(cols).not.toContain("focal_x");
});

it("allows a state with no app name, since 178 legacy entries have none", async () => {
  await env.DB.prepare(
    `INSERT INTO states (id,slug,title,device_type,os,r2_key,width,height,
       aspect_ratio,byte_size,published_at,created_at)
     VALUES ('01','t','Untitled','phone','ios','originals/01.png',1170,2532,
       0.4621,1400000,'2026-08-11T00:00:00Z','2026-08-11T00:00:00Z')`,
  ).run();
  const row = await env.DB.prepare(
    "SELECT app_name FROM states WHERE id='01'",
  ).first<{ app_name: string | null }>();
  expect(row?.app_name).toBeNull();
});

// 134 legacy phone entries carry no OS tag. Blank is the honest value; 'web'
// would be a wrong answer sitting behind the OS filter until vision fixes it.
it("allows a state with no OS", async () => {
  await env.DB.prepare(
    `INSERT INTO states (id,slug,title,device_type,r2_key,width,height,
       aspect_ratio,byte_size,published_at,created_at)
     VALUES ('03','v','No OS','phone','originals/03.png',1080,2160,
       0.5,900,'2026-08-11T00:00:00Z','2026-08-11T00:00:00Z')`,
  ).run();
  const row = await env.DB.prepare(
    "SELECT os FROM states WHERE id='03'",
  ).first<{ os: string | null }>();
  expect(row?.os).toBeNull();
});

it("still refuses an OS that is not in the taxonomy", async () => {
  await env.DB.prepare("PRAGMA foreign_keys = ON").run();
  await expect(
    env.DB
      .prepare(
        `INSERT INTO states (id,slug,title,device_type,os,r2_key,width,height,
           aspect_ratio,byte_size,published_at,created_at)
         VALUES ('04','w','Bad OS','phone','symbian','originals/04.png',1080,2160,
           0.5,900,'2026-08-11T00:00:00Z','2026-08-11T00:00:00Z')`,
      )
      .run(),
  ).rejects.toThrow();
});

it("stores curated relations and refuses self-links", async () => {
  await env.DB.prepare(
    `INSERT INTO states (id,slug,title,device_type,os,r2_key,width,height,
       aspect_ratio,byte_size,published_at,created_at)
     VALUES ('02','u','Other','phone','ios','originals/02.png',1170,2532,
       0.4621,1400000,'2026-08-11T00:00:00Z','2026-08-11T00:00:00Z')`,
  ).run();
  await env.DB.prepare(
    "INSERT INTO state_relations (state_id, related_state_id) VALUES ('01','02')",
  ).run();
  const row = await env.DB.prepare(
    "SELECT related_state_id FROM state_relations WHERE state_id='01'",
  ).first<{ related_state_id: string }>();
  expect(row?.related_state_id).toBe("02");

  await expect(
    env.DB.prepare(
      "INSERT INTO state_relations (state_id, related_state_id) VALUES ('01','01')",
    ).run(),
  ).rejects.toThrow();
});

// 34 legacy entries carry a `redirect` frontmatter path that Gatsby serves
// today. Without somewhere to put them the migration silently breaks 34 live
// URLs, which is the one failure class the plan says costs real users.
it("stores legacy redirect paths pointing at a state", async () => {
  await env.DB.prepare(
    `INSERT INTO state_redirects (from_path, state_id, created_at)
     VALUES ('/post/162083631161/no-assignments','01','2026-08-11T00:00:00Z')`,
  ).run();
  const row = await env.DB.prepare(
    "SELECT state_id FROM state_redirects WHERE from_path='/post/162083631161/no-assignments'",
  ).first<{ state_id: string }>();
  expect(row?.state_id).toBe("01");
});

it("refuses to point one path at two states", async () => {
  await expect(
    env.DB.prepare(
      `INSERT INTO state_redirects (from_path, state_id, created_at)
       VALUES ('/post/162083631161/no-assignments','02','2026-08-11T00:00:00Z')`,
    ).run(),
  ).rejects.toThrow();
});

it("indexes the full-text table over all six searchable columns", async () => {
  const row = await env.DB.prepare(
    "SELECT sql FROM sqlite_master WHERE name='states_fts'",
  ).first<{ sql: string }>();
  for (const col of [
    "title",
    "app_name",
    "tags",
    "colors",
    "screen_text",
    "description",
  ]) {
    expect(row?.sql, `fts missing ${col}`).toContain(col);
  }
});
