import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { it, expect, beforeAll } from "vitest";
import legacy from "./fixtures/legacy-urls.json";
import { couldBeRedirect, resolveRedirect } from "../src/db/redirects";
import { resolveTagPath } from "../src/lib/tags";

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});

it("resolves a retired /s/ path to the slug that replaced it", async () => {
  await env.DB.prepare(
    `INSERT INTO states (id, slug, title, device_type, r2_key, width, height,
                         aspect_ratio, byte_size, published_at, created_at)
     VALUES ('r1','no-deals-yet','No deals yet','phone','originals/r1.png',
             1080,2160,0.5,10,'2020-01-01T00:00:00Z','2020-01-01T00:00:00Z')`,
  ).run();
  await env.DB.prepare(
    `INSERT INTO state_redirects (state_id, from_path, created_at)
     VALUES ('r1','/s/tumblr_mggrayiCsC1rdf37to1_1280','2020-01-01T00:00:00Z')`,
  ).run();

  expect(
    await resolveRedirect(env.DB, "/s/tumblr_mggrayiCsC1rdf37to1_1280"),
  ).toBe("/s/no-deals-yet");
});

// 33 rows come from legacy `redirect` frontmatter and are Tumblr paths, some
// stored as a full URL. A lookup keyed on the exact stored string finds both.
it("resolves a legacy inbound path that is not a /s/ URL", async () => {
  await env.DB.prepare(
    `INSERT INTO state_redirects (state_id, from_path, created_at)
     VALUES ('r1','/post/162316071385/no-stories','2020-01-01T00:00:00Z')`,
  ).run();
  expect(await resolveRedirect(env.DB, "/post/162316071385/no-stories")).toBe(
    "/s/no-deals-yet",
  );
});

it("returns null for a path nothing claims", async () => {
  expect(await resolveRedirect(env.DB, "/s/never-existed")).toBeNull();
});

it("ignores a trailing slash, which Gatsby's URLs all carried", async () => {
  expect(
    await resolveRedirect(env.DB, "/s/tumblr_mggrayiCsC1rdf37to1_1280/"),
  ).toBe("/s/no-deals-yet");
});

// Legacy tag pages cover three dimensions that are now separate columns.
it("routes a legacy tag page to the facet it became", () => {
  expect(resolveTagPath("mobile")).toEqual({ kind: "device", value: "phone" });
  expect(resolveTagPath("desktop")).toEqual({ kind: "device", value: "desktop" });
  expect(resolveTagPath("ios")).toEqual({ kind: "os", value: "ios" });
  expect(resolveTagPath("android")).toEqual({ kind: "os", value: "android" });
  expect(resolveTagPath("onboarding")).toEqual({
    kind: "tag",
    value: "onboarding",
  });
});

// `mobil`, `emai`, `browswer` and `macOS` are all in the corpus.
it("routes the corpus typos and case variants their pages were built from", () => {
  expect(resolveTagPath("mobil")).toEqual({ kind: "device", value: "phone" });
  expect(resolveTagPath("emai")).toEqual({ kind: "tag", value: "email" });
  expect(resolveTagPath("browswer")).toEqual({ kind: "os", value: "web" });
  expect(resolveTagPath("macOS")).toEqual({ kind: "os", value: "macos" });
});

it("routes a multi-word tag from its slugified URL", () => {
  expect(resolveTagPath("first-run")).toEqual({ kind: "tag", value: "first-run" });
  expect(resolveTagPath("inbox-zero")).toEqual({ kind: "tag", value: "inbox-zero" });
  expect(resolveTagPath("pixel-2-xl")).toEqual({ kind: "os", value: "android" });
});

it("returns null for a tag path that never existed", () => {
  expect(resolveTagPath("not-a-tag-anyone-used")).toBeNull();
});

it("routes every tag page the old site published", () => {
  const unroutable = legacy.tags.filter((t) => resolveTagPath(t) === null);
  expect(unroutable, `unroutable: ${unroutable.join(", ")}`).toEqual([]);
});

// The middleware is what turns a resolved redirect into a response. Exercised
// directly, since a route-level fetch would need `main` in wrangler.jsonc, and
// the Cloudflare adapter generates that into dist/ at build time.
it("redirects a retired path with a 301 and lets a live route through", async () => {
  const { onRequest } = await import("../src/middleware");

  const context = {
    url: new URL("https://x/s/tumblr_mggrayiCsC1rdf37to1_1280"),
    redirect: (to: string, status: number) =>
      new Response(null, { status, headers: { Location: to } }),
  };

  const moved = (await onRequest(
    context as never,
    async () => new Response("Not found", { status: 404 }),
  )) as Response;
  expect(moved.status).toBe(301);
  expect(moved.headers.get("Location")).toBe("/s/no-deals-yet");

  const live = (await onRequest(
    context as never,
    async () => new Response("ok", { status: 200 }),
  )) as Response;
  expect(live.status).toBe(200);
});

it("leaves a genuine 404 alone", async () => {
  const { onRequest } = await import("../src/middleware");
  const context = {
    url: new URL("https://x/s/never-existed"),
    redirect: () => new Response(null, { status: 301 }),
  };
  const res = (await onRequest(
    context as never,
    async () => new Response("Not found", { status: 404 }),
  )) as Response;
  expect(res.status).toBe(404);
});

// Issue #28. Every 404 cost a D1 query, including scanner noise. Every stored
// path starts /s/ or /post/, so anything else is answered without one.
it("recognises the paths a redirect could claim", () => {
  expect(couldBeRedirect("/s/tumblr_mggrayiCsC1rdf37to1_1280")).toBe(true);
  expect(couldBeRedirect("/post/162316071385/no-stories")).toBe(true);
});

it("rules out the paths that make up most 404s", () => {
  expect(couldBeRedirect("/wp-admin/setup-config.php")).toBe(false);
  expect(couldBeRedirect("/favicon.ico")).toBe(false);
  expect(couldBeRedirect("/.git/config")).toBe(false);
  expect(couldBeRedirect("/tags/not-a-tag")).toBe(false);
  expect(couldBeRedirect("/")).toBe(false);
});

// Checked against every path actually stored, so the guard cannot start
// skipping a real redirect if the corpus gains a new shape.
it("claims every from_path in the table", async () => {
  const { results } = await env.DB.prepare(
    "SELECT from_path FROM state_redirects",
  ).all<{ from_path: string }>();
  const missed = results
    .map((r) => r.from_path)
    .filter((p) => !couldBeRedirect(p));
  expect(missed, `guard would skip: ${missed.join(", ")}`).toEqual([]);
});
