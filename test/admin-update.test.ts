import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { it, expect, beforeAll } from "vitest";
import { handleUpdate } from "../src/lib/admin";
import { getStateBySlug, getStateById, listDraftStates, listStateTags } from "../src/db/states";

const ID = "01J0000000000000000000UPD8";

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  await env.DB.batch([
    env.DB.prepare("INSERT INTO tags (slug, label) VALUES ('empty-cart','Empty cart'), ('onboarding','Onboarding')"),
    env.DB.prepare(
      `INSERT INTO states (id, slug, title, app_name, device_type, os, r2_key, width,
         height, aspect_ratio, byte_size, published_at, created_at)
       VALUES (?, 'nothing-here-in-feedly', 'Nothing here', 'Feedly', 'phone', 'ios',
         'originals/x.png', 1170, 2532, 0.46, 1000,
         '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z')`,
    ).bind(ID),
    env.DB.prepare(
      "INSERT INTO state_tags (state_id, tag_id) SELECT ?, id FROM tags WHERE slug = 'empty-cart'",
    ).bind(ID),
    env.DB.prepare(
      "INSERT INTO states_fts (title, app_name, tags, state_id) VALUES ('Nothing here', 'Feedly', 'Empty cart', ?)",
    ).bind(ID),
  ]);
});

const FIELDS = {
  title: "No articles yet",
  appName: "Feedly",
  appUrl: "https://feedly.com",
  deviceType: "tablet",
  os: "android",
  tagSlugs: ["onboarding"],
};

it("saves fields, tags and the search row without touching slug or published_at", async () => {
  const result = await handleUpdate(env.DB, ID, FIELDS, "save");
  if (!result.ok) throw new Error(result.error);
  expect(result).toEqual({ ok: true, slug: "nothing-here-in-feedly", status: "published" });

  const state = await getStateById(env.DB, ID);
  expect(state?.title).toBe("No articles yet");
  expect(state?.app_url).toBe("https://feedly.com");
  expect(state?.device_type).toBe("tablet");
  expect(state?.os).toBe("android");
  expect(state?.slug).toBe("nothing-here-in-feedly");
  expect(state?.published_at).toBe("2026-01-01T00:00:00Z");
  expect((await listStateTags(env.DB, ID)).map((t) => t.slug)).toEqual(["onboarding"]);

  const fts = await env.DB.prepare("SELECT title, tags FROM states_fts WHERE state_id = ?")
    .bind(ID).all<{ title: string; tags: string }>();
  expect(fts.results).toEqual([{ title: "No articles yet", tags: "Onboarding" }]);
});

it("unpublish hides the state from public reads and lists it as a draft", async () => {
  const result = await handleUpdate(env.DB, ID, FIELDS, "unpublish");
  expect(result).toMatchObject({ ok: true, status: "draft" });
  expect(await getStateBySlug(env.DB, "nothing-here-in-feedly")).toBeNull();
  expect((await listDraftStates(env.DB)).map((s) => s.id)).toEqual([ID]);
  // Still reachable for the edit screen.
  expect((await getStateById(env.DB, ID))?.status).toBe("draft");
});

it("publish restores it with the original published_at", async () => {
  const result = await handleUpdate(env.DB, ID, FIELDS, "publish");
  expect(result).toMatchObject({ ok: true, status: "published" });
  const state = await getStateBySlug(env.DB, "nothing-here-in-feedly");
  expect(state?.published_at).toBe("2026-01-01T00:00:00Z");
  expect(await listDraftStates(env.DB)).toEqual([]);
});

it("rejects missing fields, unknown taxonomy rows and unknown ids", async () => {
  expect(await handleUpdate(env.DB, ID, { ...FIELDS, title: " " }, "save"))
    .toMatchObject({ ok: false, status: 422, error: "Missing: title" });
  expect(await handleUpdate(env.DB, ID, { ...FIELDS, os: "beos" }, "save"))
    .toMatchObject({ ok: false, status: 422, error: "Unknown os" });
  expect(await handleUpdate(env.DB, ID, { ...FIELDS, tagSlugs: ["nope"] }, "save"))
    .toMatchObject({ ok: false, status: 422, error: "Unknown tag" });
  expect(await handleUpdate(env.DB, "missing", FIELDS, "save"))
    .toMatchObject({ ok: false, status: 404 });
});
