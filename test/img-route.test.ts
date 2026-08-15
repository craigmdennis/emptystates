import { env } from "cloudflare:workers";
import { it, expect, beforeAll } from "vitest";
import { GET } from "../src/pages/img/[...key]";

const BYTES = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x57, 0x45, 0x42]);

beforeAll(async () => {
  await env.MEDIA.put("w640/test.webp", BYTES, {
    httpMetadata: { contentType: "image/webp" },
  });
  // Put without metadata, as an object stored before contentType was set.
  await env.MEDIA.put("originals/bare.bin", BYTES);
});

const call = (key: string | undefined) =>
  GET({ params: { key } } as never) as Promise<Response>;

it("serves an object with the content type it was stored under", async () => {
  const res = await call("w640/test.webp");
  expect(res.status).toBe(200);
  expect(res.headers.get("Content-Type")).toBe("image/webp");
  expect(new Uint8Array(await res.arrayBuffer())).toEqual(BYTES);
});

it("marks a served object immutable", async () => {
  const res = await call("w640/test.webp");
  expect(res.headers.get("Cache-Control")).toContain("immutable");
  expect(res.headers.get("ETag")).toBeTruthy();
});

// Guessing from the key would be wrong for this corpus, which holds .jpg files
// whose bytes are PNG.
it("falls back to a byte stream when the object stored no content type", async () => {
  const res = await call("originals/bare.bin");
  expect(res.status).toBe(200);
  expect(res.headers.get("Content-Type")).toBe("application/octet-stream");
});

it("returns 404 for a key that is not in the bucket", async () => {
  expect((await call("w640/absent.webp")).status).toBe(404);
});

it("returns 404 when no key was matched at all", async () => {
  expect((await call(undefined)).status).toBe(404);
});
