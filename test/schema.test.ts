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
