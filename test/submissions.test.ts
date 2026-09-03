import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { it, expect, beforeAll } from "vitest";
import {
  insertDraft, getDraft, nextPendingDraft, countPendingDrafts, listPendingDrafts,
} from "../src/db/submissions";

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});

it("round-trips a draft", async () => {
  await insertDraft(env.DB, {
    id: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
    r2Key: "submissions/01ARZ3NDEKTSV4RRFFQ69G5FAV.png",
    width: 1170, height: 2532, byteSize: 123456,
  });
  const row = await getDraft(env.DB, "01ARZ3NDEKTSV4RRFFQ69G5FAV");
  expect(row?.width).toBe(1170);
  expect(row?.aspect_ratio).toBeCloseTo(1170 / 2532, 5);
});

it("counts and orders pending drafts oldest first", async () => {
  await insertDraft(env.DB, { id: "01BX0000000000000000000000", r2Key: "submissions/01BX0000000000000000000000.png", width: 100, height: 200, byteSize: 10 });
  expect(await countPendingDrafts(env.DB)).toBe(2);
  expect(await nextPendingDraft(env.DB)).toBe("01ARZ3NDEKTSV4RRFFQ69G5FAV");
  expect(await nextPendingDraft(env.DB, "01ARZ3NDEKTSV4RRFFQ69G5FAV")).toBe("01BX0000000000000000000000");
  expect((await listPendingDrafts(env.DB)).map((d) => d.id)).toEqual([
    "01ARZ3NDEKTSV4RRFFQ69G5FAV", "01BX0000000000000000000000",
  ]);
});

it("getDraft ignores non-pending and non-admin rows", async () => {
  await env.DB.prepare(
    `INSERT INTO submissions (id, status, source, r2_key, created_at)
     VALUES ('pub1','pending','public','submissions/pub1.png','2026-01-01T00:00:00Z')`,
  ).run();
  expect(await getDraft(env.DB, "pub1")).toBeNull();
});
