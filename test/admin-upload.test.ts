import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { it, expect, beforeAll } from "vitest";
import { handleUpload, type ImagesLike } from "../src/lib/admin";

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4]);

const fakeImages = (info: { format: string; width: number; height: number }): ImagesLike => ({
  info: async () => info,
  input: () => ({
    transform: () => ({
      output: async () => ({ response: () => new Response(PNG) }),
    }),
  }),
});

const adminEnv = (images: ImagesLike) =>
  ({ db: env.DB, media: env.MEDIA, images }) as Parameters<typeof handleUpload>[0];

it("writes the original to R2 and a pending draft row", async () => {
  const file = new File([PNG], "IMG_0001.png", { type: "image/png" });
  const result = await handleUpload(
    adminEnv(fakeImages({ format: "image/png", width: 1170, height: 2532 })),
    file,
  );
  if (!result.ok) throw new Error(result.error);
  expect(result.url).toBe(`/admin/new?draft=${result.id}`);

  const obj = await env.MEDIA.get(`submissions/${result.id}.png`);
  expect(obj).not.toBeNull();
  expect(obj?.httpMetadata?.contentType).toBe("image/png");

  const row = await env.DB.prepare("SELECT * FROM submissions WHERE id = ?")
    .bind(result.id).first<Record<string, unknown>>();
  expect(row?.status).toBe("pending");
  expect(row?.source).toBe("admin");
  expect(row?.width).toBe(1170);
  expect(row?.byte_size).toBe(PNG.byteLength);
});

it("rejects a format the Images API cannot transform", async () => {
  const file = new File([PNG], "movie.gif", { type: "image/gif" });
  const result = await handleUpload(
    adminEnv(fakeImages({ format: "image/gif", width: 100, height: 100 })),
    file,
  );
  expect(result).toMatchObject({ ok: false, status: 415 });
});

it("rejects bytes that fail to decode", async () => {
  const broken: ImagesLike = {
    info: async () => { throw new Error("not an image"); },
    input: () => { throw new Error("unreachable"); },
  };
  const file = new File([new Uint8Array([1, 2, 3])], "x.png", { type: "image/png" });
  const result = await handleUpload(adminEnv(broken), file);
  expect(result).toMatchObject({ ok: false, status: 415 });
});
