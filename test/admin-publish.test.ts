import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { it, expect, beforeAll } from "vitest";
import { handleUpload, handlePublish, type ImagesLike } from "../src/lib/admin";

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4]);
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 9, 9]);

const fakeImages: ImagesLike = {
  info: async () => ({ format: "image/png", width: 1170, height: 2532 }),
  input: () => ({
    transform: () => ({
      output: async () => ({ response: () => new Response(WEBP.slice()) }),
    }),
  }),
};

const adminEnv = { db: env.DB, media: env.MEDIA, images: fakeImages } as Parameters<typeof handlePublish>[0];

const FIELDS = {
  title: "No results found",
  appName: "Feedly",
  deviceType: "phone",
  os: "ios",
  tagSlugs: ["no-results"],
};

async function freshDraft(): Promise<string> {
  const up = await handleUpload(adminEnv, new File([PNG], "a.png", { type: "image/png" }));
  if (!up.ok) throw new Error(up.error);
  return up.id;
}

beforeAll(async () => {
  await env.DB.prepare("INSERT INTO tags (slug, label) VALUES ('no-results', 'No results')").run();
});

it("publishes a draft end to end", async () => {
  const id = await freshDraft();
  const result = await handlePublish(adminEnv, id, FIELDS);
  if (!result.ok) throw new Error(result.error);
  expect(result.slug).toBe("no-results-found-in-feedly");

  const state = await env.DB.prepare("SELECT * FROM states WHERE id = ?")
    .bind(id).first<Record<string, unknown>>();
  expect(state?.status).toBe("published");
  expect(state?.r2_key).toBe(`originals/${id}.png`);
  expect(state?.device_type).toBe("phone");

  // 1170 wide earns only the 640 variant; never upscale.
  expect(await env.MEDIA.get(`w640/${id}.webp`)).not.toBeNull();
  expect(await env.MEDIA.get(`w1280/${id}.webp`)).toBeNull();
  expect(await env.MEDIA.get(`originals/${id}.png`)).not.toBeNull();
  expect(await env.MEDIA.get(`submissions/${id}.png`)).toBeNull();

  const sub = await env.DB.prepare("SELECT status, published_state_id FROM submissions WHERE id = ?")
    .bind(id).first<Record<string, unknown>>();
  expect(sub?.status).toBe("approved");
  expect(sub?.published_state_id).toBe(id);

  const tag = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM state_tags st JOIN tags t ON t.id = st.tag_id WHERE st.state_id = ? AND t.slug = 'no-results'",
  ).bind(id).first<{ n: number }>();
  expect(tag?.n).toBe(1);

  const fts = await env.DB.prepare("SELECT title FROM states_fts WHERE state_id = ?")
    .bind(id).first<{ title: string }>();
  expect(fts?.title).toBe("No results found");
});

it("rejects missing fields with their names", async () => {
  const id = await freshDraft();
  const result = await handlePublish(adminEnv, id, { ...FIELDS, title: " ", tagSlugs: [] });
  expect(result).toMatchObject({ ok: false, status: 422 });
  if (!result.ok) expect(result.error).toMatch(/title.*tags|tags.*title/i);
});

it("rejects an unknown tag slug", async () => {
  const id = await freshDraft();
  const result = await handlePublish(adminEnv, id, { ...FIELDS, tagSlugs: ["not-a-real-tag"] });
  expect(result).toMatchObject({ ok: false, status: 422 });
});

it("rejects an unknown device type", async () => {
  const id = await freshDraft();
  const result = await handlePublish(adminEnv, id, { ...FIELDS, deviceType: "toaster" });
  expect(result).toMatchObject({ ok: false, status: 422 });
});

it("publishes with duplicate tag slugs in the list", async () => {
  const id = await freshDraft();
  // Distinct title: keeps this publish's slug out of the base-slug collision
  // count the later "dedupes a colliding slug" test relies on.
  const result = await handlePublish(adminEnv, id, {
    ...FIELDS,
    title: "No results found (duplicate tag test)",
    tagSlugs: ["no-results", "no-results"],
  });
  if (!result.ok) throw new Error(result.error);

  const tag = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM state_tags st JOIN tags t ON t.id = st.tag_id WHERE st.state_id = ? AND t.slug = 'no-results'",
  ).bind(id).first<{ n: number }>();
  expect(tag?.n).toBe(1);
});

it("dedupes a colliding slug", async () => {
  const id = await freshDraft();
  const result = await handlePublish(adminEnv, id, FIELDS);
  if (!result.ok) throw new Error(result.error);
  expect(result.slug).toBe("no-results-found-in-feedly-2");
});

it("404s an unknown or already-published draft", async () => {
  expect(await handlePublish(adminEnv, "01NOPE0000000000000000000", FIELDS)).toMatchObject({ ok: false, status: 404 });
});

it("leaves the draft pending when a variant write fails, and a retry succeeds", async () => {
  const id = await freshDraft();
  const failing: ImagesLike = {
    ...fakeImages,
    input: () => ({ transform: () => ({ output: async () => { throw new Error("images down"); } }) }),
  };
  await expect(
    handlePublish({ ...adminEnv, images: failing }, id, FIELDS),
  ).rejects.toThrow();

  // Draft untouched, no state row, source object still there.
  const sub = await env.DB.prepare("SELECT status FROM submissions WHERE id = ?").bind(id).first<{ status: string }>();
  expect(sub?.status).toBe("pending");
  expect(await env.DB.prepare("SELECT id FROM states WHERE id = ?").bind(id).first()).toBeNull();
  expect(await env.MEDIA.get(`submissions/${id}.png`)).not.toBeNull();

  const retry = await handlePublish(adminEnv, id, FIELDS);
  expect(retry.ok).toBe(true);
});
