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
const source = (suffix: string) =>
  Object.entries(env.TEST_SOURCES as Record<string, string>).find(([p]) =>
    p.endsWith(suffix),
  )?.[1] as string;
const page = source("src/pages/admin/new.astro");
const fields = source("src/components/admin/StateFields.astro");
const layout = source("src/layouts/Admin.astro");

it("uploads via the picker and publishes via a plain form", () => {
  expect(page).toContain('type="file"');
  expect(page).toContain('accept="image/*"');
  expect(page).toContain("multiple");
  expect(page).toContain('action="/api/admin/publish"');
  expect(page).toContain('method="POST"');
  expect(fields).toMatch(/name="tags"/);
  expect(layout).toContain("manifest.webmanifest");
});

it("carries failed uploads instead of stranding drafts mid-batch", () => {
  // The picker script must not bail out of the loop on a failed file: it has
  // to keep going and count failures rather than `return` on the first one.
  expect(page).not.toMatch(/failedCount\+\+;\s*\n\s*return;/);
  expect(page).toContain("failedCount");
  expect(page).toMatch(/failed=\$\{failedCount\}/);
  // ...and the edit strip has to render that count somewhere the phone lands.
  expect(page).toMatch(/searchParams\.get\("failed"\)/);
  expect(page).toMatch(/upload\(s\) failed/);
});

const edit = source("src/pages/admin/edit/[id].astro");
const detail = source("src/pages/s/[slug].astro");

it("edits through the shared fields and names the intent on each button", () => {
  expect(edit).toContain('action="/api/admin/update"');
  expect(edit).toContain("<StateFields");
  expect(edit).toMatch(/name="intent"\s+value="save"/);
  expect(edit).toMatch(/name="intent"\s+value="unpublish"/);
  expect(edit).toMatch(/name="intent"\s+value="publish"/);
});

it("shows the Edit link on the detail page to the admin only", () => {
  expect(detail).toMatch(/locals\.admin && \(\s*<p class="original">\s*<a href=\{`\/admin\/edit\//);
});
