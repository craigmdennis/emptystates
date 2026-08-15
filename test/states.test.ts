import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { it, expect, beforeEach } from "vitest";
import { getDb } from "../src/db/client";
import { getAdjacent, getStateBySlug, listStates } from "../src/db/states";
import { listFacets } from "../src/db/taxonomies";

type Seed = {
  slug: string;
  title: string;
  device: string;
  os: string | null;
  publishedAt: string;
  status?: "published" | "draft";
  tags?: string[];
};

const SEEDS: Seed[] = [
  {
    slug: "no-messages",
    title: "No messages",
    device: "phone",
    os: "ios",
    publishedAt: "2020-03-01T00:00:00.000Z",
    tags: ["inbox-zero"],
  },
  {
    slug: "no-repos",
    title: "No repositories",
    device: "desktop",
    os: "macos",
    publishedAt: "2021-06-01T00:00:00.000Z",
    tags: ["first-run"],
  },
  {
    slug: "no-photos",
    title: "No photos",
    device: "phone",
    os: null,
    publishedAt: "2022-09-01T00:00:00.000Z",
    tags: ["inbox-zero", "first-run"],
  },
  {
    slug: "a-draft",
    title: "Still a draft",
    device: "tablet",
    os: "android",
    publishedAt: "2023-01-01T00:00:00.000Z",
    status: "draft",
  },
];

beforeEach(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  for (const t of ["state_tags", "tags", "states"]) {
    await env.DB.prepare(`DELETE FROM ${t}`).run();
  }

  for (const [i, s] of SEEDS.entries()) {
    const id = `id-${i}`;
    await env.DB.prepare(
      `INSERT INTO states
         (id, slug, title, app_name, app_url, device_type, os, r2_key,
          width, height, aspect_ratio, byte_size, description, status,
          is_legacy, submitter_name, submitter_handle, published_at, created_at)
       VALUES (?, ?, ?, ?, NULL, ?, ?, ?, 1080, 2160, 0.5, 4096, NULL, ?,
               1, NULL, NULL, ?, ?)`,
    )
      .bind(
        id,
        s.slug,
        s.title,
        `${s.title} app`,
        s.device,
        s.os,
        `originals/${id}.png`,
        s.status ?? "published",
        s.publishedAt,
        s.publishedAt,
      )
      .run();

    for (const tag of s.tags ?? []) {
      await env.DB.prepare(
        "INSERT INTO tags (slug, label) VALUES (?, ?) ON CONFLICT(slug) DO NOTHING",
      )
        .bind(tag, tag)
        .run();
      await env.DB.prepare(
        `INSERT INTO state_tags (state_id, tag_id)
         VALUES (?, (SELECT id FROM tags WHERE slug = ?))`,
      )
        .bind(id, tag)
        .run();
    }
  }
});

// Astro 6 removed Astro.locals.runtime.env. The binding comes off the Workers
// runtime import now, so getDb takes no argument.
it("reads the D1 binding from the Workers runtime", () => {
  expect(getDb()).toBe(env.DB);
});

it("lists published states newest first with a total", async () => {
  const { rows, total } = await listStates(env.DB, { page: 1, perPage: 2 });
  expect(rows).toHaveLength(2);
  expect(total).toBe(3);
  expect(rows[0].published_at >= rows[1].published_at).toBe(true);
});

it("counts every published match in total, not just the page", async () => {
  const { rows, total } = await listStates(env.DB, { page: 2, perPage: 2 });
  expect(rows).toHaveLength(1);
  expect(total).toBe(3);
  expect(rows[0].slug).toBe("no-messages");
});

it("returns aspect_ratio so the gallery never measures images", async () => {
  const { rows } = await listStates(env.DB, { page: 1, perPage: 1 });
  expect(rows[0].aspect_ratio).toBeGreaterThan(0);
});

it("leaves drafts out of the gallery", async () => {
  const { rows, total } = await listStates(env.DB, { page: 1, perPage: 50 });
  expect(total).toBe(3);
  expect(rows.map((r) => r.slug)).not.toContain("a-draft");
});

it("filters by device", async () => {
  const { rows, total } = await listStates(env.DB, {
    page: 1,
    perPage: 50,
    device: "phone",
  });
  expect(total).toBe(2);
  expect(rows.every((r) => r.device_type === "phone")).toBe(true);
});

it("filters by OS", async () => {
  const { rows } = await listStates(env.DB, {
    page: 1,
    perPage: 50,
    os: "macos",
  });
  expect(rows.map((r) => r.slug)).toEqual(["no-repos"]);
});

it("filters by tag", async () => {
  const { rows } = await listStates(env.DB, {
    page: 1,
    perPage: 50,
    tag: "inbox-zero",
  });
  expect(rows.map((r) => r.slug)).toEqual(["no-photos", "no-messages"]);
});

it("finds one published state by slug", async () => {
  const row = await getStateBySlug(env.DB, "no-repos");
  expect(row?.title).toBe("No repositories");
  expect(row?.byte_size).toBe(4096);
});

it("returns null for a slug that is missing or still a draft", async () => {
  expect(await getStateBySlug(env.DB, "nothing-here")).toBeNull();
  expect(await getStateBySlug(env.DB, "a-draft")).toBeNull();
});

it("walks to the neighbours either side by published date", async () => {
  const { prev, next } = await getAdjacent(env.DB, "2021-06-01T00:00:00.000Z");
  expect(prev?.slug).toBe("no-messages");
  expect(next?.slug).toBe("no-photos");
});

it("returns null past either end of the gallery", async () => {
  const oldest = await getAdjacent(env.DB, "2020-03-01T00:00:00.000Z");
  expect(oldest.prev).toBeNull();
  const newest = await getAdjacent(env.DB, "2022-09-01T00:00:00.000Z");
  expect(newest.next).toBeNull();
});

it("facet counts never include a zero-count option", async () => {
  const { devices, oses, tags } = await listFacets(env.DB);
  expect(devices.every((d) => d.count > 0)).toBe(true);
  expect(oses.every((o) => o.count > 0)).toBe(true);
  expect(tags.every((t) => t.count > 0)).toBe(true);
  // Seeded devices are phone and desktop only; tv, console and watch exist in
  // the taxonomy and must not appear as options nobody can pick.
  expect(devices.map((d) => d.slug)).toEqual(["phone", "desktop"]);
});

// 137 legacy entries carry no OS. Blank is missing, and offering it as a
// filter value would return rows nobody asked for.
it("keeps a null OS out of the OS facet", async () => {
  const { oses } = await listFacets(env.DB);
  expect(oses.map((o) => o.slug)).toEqual(["ios", "macos"]);
  expect(oses.find((o) => o.slug === "ios")?.count).toBe(1);
});

it("counts facets over published states only", async () => {
  const { devices } = await listFacets(env.DB);
  expect(devices.find((d) => d.slug === "tablet")).toBeUndefined();
});
