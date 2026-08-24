import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { it, expect, beforeAll } from "vitest";
import {
  listDeviceRanges,
  listOsOptions,
  listTagOptions,
  listAppNames,
} from "../src/db/taxonomies";

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  await env.DB.prepare(
    `INSERT INTO states (id, slug, title, app_name, device_type, r2_key, width,
       height, aspect_ratio, byte_size, published_at, created_at)
     VALUES ('a1','x','X','Feedly','phone','originals/a1.png',10,20,0.5,1,
             '2026-01-01T00:00:00Z','2026-01-01T00:00:00Z')`,
  ).run();
  await env.DB.prepare(
    "INSERT INTO tags (slug, label) VALUES ('empty-cart','Empty cart')",
  ).run();
});

it("lists active device ranges in sort order", async () => {
  const d = await listDeviceRanges(env.DB);
  expect(d[0].slug).toBe("phone");
  expect(d.every((x) => x.is_active === 1)).toBe(true);
});

it("lists OS options and tag options", async () => {
  expect((await listOsOptions(env.DB)).map((o) => o.slug)).toContain("ios");
  expect((await listTagOptions(env.DB)).map((t) => t.slug)).toContain(
    "empty-cart",
  );
});

it("lists distinct app names for the datalist", async () => {
  expect(await listAppNames(env.DB)).toEqual(["Feedly"]);
});

// The page itself renders in workerd, so assert over its source the way
// source.test.ts does: the load-bearing attributes must exist.
const page = Object.entries(env.TEST_SOURCES as Record<string, string>).find(
  ([p]) => p.endsWith("src/pages/admin/new.astro"),
)?.[1] as string;

it("uploads via the picker and publishes via a plain form", () => {
  expect(page).toContain('type="file"');
  expect(page).toContain('accept="image/*"');
  expect(page).toContain("multiple");
  expect(page).toContain('action="/api/admin/publish"');
  expect(page).toContain('method="POST"');
  expect(page).toMatch(/name="tags"/);
  expect(page).toContain("manifest.webmanifest");
});
