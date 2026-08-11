import { env } from "cloudflare:workers";
import { it, expect } from "vitest";

it("exposes the D1 and R2 bindings to tests", async () => {
  expect(env.DB).toBeDefined();
  expect(env.MEDIA).toBeDefined();
  const { results } = await env.DB.prepare("SELECT 1 AS ok").all();
  expect(results[0].ok).toBe(1);
});

// Asserts the binding is wired, not how many migrations exist — a hardcoded
// count fails on every future migration while proving nothing about this one.
it("exposes the migrations binding", () => {
  expect(Array.isArray(env.TEST_MIGRATIONS)).toBe(true);
  expect(env.TEST_MIGRATIONS.length).toBeGreaterThan(0);
  expect(env.TEST_MIGRATIONS.map((m) => m.name)).toContain(
    "0001_taxonomies.sql",
  );
});
