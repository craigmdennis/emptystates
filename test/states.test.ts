import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { it, expect, beforeEach } from "vitest";
import { getDb } from "../src/db/client";
import {
  countStates,
  getAdjacent,
  getStateBySlug,
  listStateTags,
  listStates,
} from "../src/db/states";
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
    tags: ["inbox-zero"],
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

// Next means the entry after this one in the gallery, which is ordered newest
// first — so Next is older. Nobody reading a grid left to right thinks of the
// tile after the one they clicked as "further back in time"; they think of it
// as the next one along.
it("walks to the neighbours in the order the gallery reads", async () => {
  const { prev, next } = await getAdjacent(env.DB, "2021-06-01T00:00:00.000Z");
  expect(next?.slug).toBe("no-messages");
  expect(prev?.slug).toBe("no-photos");
});

it("returns null past either end of the gallery", async () => {
  // The oldest entry is the last tile: nothing comes after it.
  const oldest = await getAdjacent(env.DB, "2020-03-01T00:00:00.000Z");
  expect(oldest.next).toBeNull();
  // The newest is the first tile: nothing comes before it.
  const newest = await getAdjacent(env.DB, "2022-09-01T00:00:00.000Z");
  expect(newest.prev).toBeNull();
});

// Position counts up as Next is followed, because both now run the same way
// the gallery does.
it("counts position up as Next is followed", async () => {
  const first = await getAdjacent(env.DB, "2022-09-01T00:00:00.000Z");
  expect(first.position).toBe(1);
  const second = await getAdjacent(env.DB, first.next!.published_at);
  expect(second.position).toBe(2);
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

// The header prints the collection size on every page, including ones that
// never list states. A draft is an entry whose picture survived without its
// frontmatter, and counting one would advertise an entry nobody can reach.
it("counts published states for the header", async () => {
  expect(await countStates(env.DB)).toBe(3);
});

// "3 / 235" on the detail page. Newest first, the same order the gallery uses,
// so the number a reader sees stepping through with Next counts up.
it("gives an entry its position in the collection", async () => {
  const newest = await getStateBySlug(env.DB, "no-photos");
  const oldest = await getStateBySlug(env.DB, "no-messages");

  expect((await getAdjacent(env.DB, newest!.published_at)).position).toBe(1);
  expect((await getAdjacent(env.DB, oldest!.published_at)).position).toBe(3);
});

// AND, not OR. Two tags means the entries carrying both — an OR would widen
// the gallery as the reader narrows it, which is the opposite of filtering.
it("filters on several tags at once", async () => {
  const both = await listStates(env.DB, {
    page: 1,
    perPage: 60,
    tags: ["inbox-zero", "first-run"],
  });
  expect(both.rows.map((r) => r.slug)).toEqual(["no-photos"]);
  expect(both.total).toBe(1);
});

// Tags are a join table, so they are not on StateRow. The detail page shows
// them as links back to the filtered gallery.
it("lists one entry's tags", async () => {
  const state = await getStateBySlug(env.DB, "no-photos");
  const tags = await listStateTags(env.DB, state!.id);
  expect(tags.map((t) => t.slug).sort()).toEqual(["first-run", "inbox-zero"]);
});

it("returns no tags for an entry carrying none", async () => {
  const state = await getStateBySlug(env.DB, "no-messages");
  const tags = await listStateTags(env.DB, state!.id);
  expect(tags.map((t) => t.slug)).toEqual(["inbox-zero"]);
});
