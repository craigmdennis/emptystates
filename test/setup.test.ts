import { env } from "cloudflare:test";
import { it, expect } from "vitest";

it("exposes the D1 and R2 bindings to tests", async () => {
  expect(env.DB).toBeDefined();
  expect(env.MEDIA).toBeDefined();
  const { results } = await env.DB.prepare("SELECT 1 AS ok").all();
  expect(results[0].ok).toBe(1);
});

it("exposes the migrations binding", () => {
  expect(Array.isArray(env.TEST_MIGRATIONS)).toBe(true);
});
