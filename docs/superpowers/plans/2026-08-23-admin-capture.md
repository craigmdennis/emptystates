# Admin Capture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A phone-first admin at `/admin/new` that takes a screenshot from the photo picker or an iOS Shortcut and publishes it live with one tap — no commit, no deploy.

**Architecture:** Cloudflare Access JWT verification in Astro middleware guards `/admin/*` and `/api/admin/*`. Upload writes the original to R2 `submissions/` and a draft row to the existing `submissions` table. Publish copies to `originals/`, writes WebP variants through the Images binding, and commits all D1 rows in one batch — the site is `output: "server"`, so the entry is live when the batch commits.

**Tech Stack:** Astro 7 on Cloudflare Workers, D1, R2, Images binding, vitest-pool-workers. Zero new npm dependencies.

**Spec:** `docs/superpowers/specs/2026-08-23-admin-capture-design.md`

## Global Constraints

- **No new npm dependencies.** JWT verification uses WebCrypto; image work uses the Images binding.
- **No emoji** anywhere: code, UI copy, commits.
- Bindings come off `import { env } from "cloudflare:workers"` **only in route/middleware files**; every `src/lib/` and `src/db/` function takes its bindings as parameters (the repo's `client.ts` pattern).
- Variant widths/keys come from the existing `src/lib/variants.ts` (`VARIANT_WIDTHS` 640/1280/2560, `variantKey(w, id)` = `w<w>/<id>.webp`, quality 82). Never upscale.
- Slugs come from the existing `src/lib/slug.ts` (`slugify`, `dedupeSlug`).
- FTS rows are written only through `writeFtsRow` from `src/db/fts.ts`, batched with the write that made them necessary.
- The state id **is** the submission id (a ULID from `ulidx`), so retried publishes hit the same R2 keys and slug.
- Auth **fails closed**: missing config or missing/invalid JWT → 401. `import.meta.env.DEV` is the only bypass and only exists under `astro dev`.
- Tests run with `npm test` (vitest-pool-workers, real D1 via `applyD1Migrations(env.DB, env.TEST_MIGRATIONS)`, real R2 via `env.MEDIA`). The Images binding is faked in tests through the `ImagesLike` parameter type — no test calls the real one.
- Commit after every green test cycle. Commit messages in the repo's style: `feat:`, `test:`, `docs:` prefixes, imperative, no emoji.

## File Map

| File | Responsibility |
|---|---|
| `src/lib/access.ts` (new) | Verify a Cf-Access JWT with WebCrypto; decide which paths need auth |
| `src/middleware.ts` (modify) | Mount the auth gate before the existing redirect logic |
| `src/lib/device.ts` (new) | Derive a device slug from an aspect ratio |
| `src/db/submissions.ts` (new) | All reads/writes of the `submissions` table the admin needs |
| `src/lib/admin.ts` (new) | `ImagesLike` type; upload + publish orchestration, bindings as params |
| `src/pages/api/admin/upload.ts` (new) | Thin route: env → `handleUpload` |
| `src/pages/api/admin/publish.ts` (new) | Thin route: form parse, env → `handlePublish`, 303 redirect |
| `src/pages/admin/new.astro` (new) | Picker screen and edit screen |
| `public/manifest.webmanifest` (new) | Home-screen install for `/admin/new` |
| `wrangler.jsonc` (modify) | `images` binding; update the "only reads" comment |
| `docs/shortcut.md` (new) | iOS Shortcut recipe + Access setup checklist |

---

### Task 1: Access JWT verification and the middleware gate

**Files:**
- Create: `src/lib/access.ts`
- Modify: `src/middleware.ts`
- Modify: `wrangler.jsonc` (images binding — added here so `npm test` proves the vitest pool accepts the key before anything depends on it)
- Test: `test/access.test.ts`

**Interfaces:**
- Produces: `requiresAuth(pathname: string): boolean`
- Produces: `verifyAccessJwt(token: string, cfg: { teamDomain: string; aud: string }, fetchKeys?: () => Promise<JsonWebKey[]>): Promise<string | null>` — resolves to the authenticated email, or null for any failure. `fetchKeys` defaults to fetching `https://<teamDomain>/cdn-cgi/access/certs` with a module-level cache; tests inject their own.

- [ ] **Step 1: Add the images binding to `wrangler.jsonc`** (after the `r2_buckets` array):

```jsonc
  "images": {
    "binding": "IMAGES"
  }
```

Also replace the sentence `The rebuild only reads, so a staging session cannot change what the live site serves.` in the D1 comment with: `The admin under /admin writes; Access guards it on every hostname, and the middleware returns 401 anywhere Access is not configured.`

- [ ] **Step 2: Run `npm test`** — expected: the existing suite still passes with the new binding key. If `@cloudflare/vitest-pool-workers` rejects the `images` key, report back before continuing; do not work around it silently.

- [ ] **Step 3: Write the failing test** — `test/access.test.ts`:

```ts
import { it, expect, describe } from "vitest";
import { requiresAuth, verifyAccessJwt } from "../src/lib/access";

const enc = (o: object) =>
  btoa(JSON.stringify(o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** Build a real RS256 JWT with a throwaway WebCrypto key. */
async function makeToken(claims: object, kid = "test-key") {
  const pair = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  );
  const header = enc({ alg: "RS256", kid, typ: "JWT" });
  const payload = enc(claims);
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    pair.privateKey,
    new TextEncoder().encode(`${header}.${payload}`),
  );
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const jwk = { ...(await crypto.subtle.exportKey("jwk", pair.publicKey)), kid };
  return { token: `${header}.${payload}.${sigB64}`, jwk: jwk as JsonWebKey };
}

const CFG = { teamDomain: "example.cloudflareaccess.com", aud: "aud-tag" };
const future = Math.floor(Date.now() / 1000) + 600;

describe("verifyAccessJwt", () => {
  it("returns the email for a valid token", async () => {
    const { token, jwk } = await makeToken({
      aud: ["aud-tag"], email: "me@example.com", exp: future,
      iss: "https://example.cloudflareaccess.com",
    });
    expect(await verifyAccessJwt(token, CFG, async () => [jwk])).toBe("me@example.com");
  });

  it("rejects a wrong audience", async () => {
    const { token, jwk } = await makeToken({
      aud: ["other"], email: "me@example.com", exp: future,
      iss: "https://example.cloudflareaccess.com",
    });
    expect(await verifyAccessJwt(token, CFG, async () => [jwk])).toBeNull();
  });

  it("rejects an expired token", async () => {
    const { token, jwk } = await makeToken({
      aud: ["aud-tag"], email: "me@example.com",
      exp: Math.floor(Date.now() / 1000) - 10,
      iss: "https://example.cloudflareaccess.com",
    });
    expect(await verifyAccessJwt(token, CFG, async () => [jwk])).toBeNull();
  });

  it("rejects a token signed by a key the team does not hold", async () => {
    const { token } = await makeToken({
      aud: ["aud-tag"], email: "me@example.com", exp: future,
      iss: "https://example.cloudflareaccess.com",
    });
    const { jwk: strangerKey } = await makeToken({}, "test-key");
    expect(await verifyAccessJwt(token, CFG, async () => [strangerKey])).toBeNull();
  });

  it("rejects garbage without throwing", async () => {
    expect(await verifyAccessJwt("not-a-jwt", CFG, async () => [])).toBeNull();
  });
});

describe("requiresAuth", () => {
  it.each(["/admin", "/admin/new", "/api/admin/upload", "/api/admin/publish"])(
    "guards %s", (p) => expect(requiresAuth(p)).toBe(true),
  );
  it.each(["/", "/s/some-slug", "/administrator", "/api/other", "/img/w640/x.webp"])(
    "leaves %s open", (p) => expect(requiresAuth(p)).toBe(false),
  );
});
```

- [ ] **Step 4: Run it** — `npm test -- access` — expected: FAIL, module not found.

- [ ] **Step 5: Implement `src/lib/access.ts`:**

```ts
/**
 * Cloudflare Access JWT verification, with WebCrypto and no dependency.
 *
 * The middleware trusts `Cf-Access-Jwt-Assertion` only after verifying it
 * against the team's public keys — trusting the email header alone is safe
 * only if the origin is unreachable except through Access, an assumption
 * spec 04 declines to make. Every failure path returns null; the caller
 * turns null into 401, so the gate fails closed.
 */

export type AccessConfig = { teamDomain: string; aud: string };

/** `/admin` and `/api/admin`, their subpaths, and nothing else. */
export function requiresAuth(pathname: string): boolean {
  return /^\/(?:api\/)?admin(?:\/|$)/.test(pathname);
}

function b64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function decodeJson(part: string): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(b64urlToBytes(part)));
}

// Keys change rarely and the isolate is short-lived, so an in-module cache
// is enough; a stale set only matters across a key rotation, and the next
// isolate fetches fresh.
let cachedKeys: { keys: JsonWebKey[]; at: number } | null = null;
const KEY_TTL_MS = 60 * 60 * 1000;

async function fetchTeamKeys(teamDomain: string): Promise<JsonWebKey[]> {
  if (cachedKeys && Date.now() - cachedKeys.at < KEY_TTL_MS) return cachedKeys.keys;
  const res = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`);
  if (!res.ok) return [];
  const { keys } = (await res.json()) as { keys: JsonWebKey[] };
  cachedKeys = { keys, at: Date.now() };
  return keys;
}

export async function verifyAccessJwt(
  token: string,
  cfg: AccessConfig,
  fetchKeys: () => Promise<JsonWebKey[]> = () => fetchTeamKeys(cfg.teamDomain),
): Promise<string | null> {
  try {
    const [h, p, s] = token.split(".");
    if (!h || !p || !s) return null;

    const header = decodeJson(h) as { alg?: string; kid?: string };
    if (header.alg !== "RS256") return null;

    const payload = decodeJson(p) as {
      aud?: string | string[]; exp?: number; iss?: string; email?: string; sub?: string;
    };
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!aud.includes(cfg.aud)) return null;
    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) return null;
    if (payload.iss !== `https://${cfg.teamDomain}`) return null;

    const keys = await fetchKeys();
    const jwk = keys.find((k) => (k as { kid?: string }).kid === header.kid) ??
      keys[0];
    if (!jwk) return null;

    const key = await crypto.subtle.importKey(
      "jwk", jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false, ["verify"],
    );
    const valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5", key,
      b64urlToBytes(s),
      new TextEncoder().encode(`${h}.${p}`),
    );
    if (!valid) return null;

    return payload.email ?? payload.sub ?? null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 6: Run it** — `npm test -- access` — expected: PASS. One note: the wrong-key test relies on the verifier picking the offered key when `kid` matches — both tokens use kid `test-key`, so the stranger's key is selected and verification fails on the signature. Confirm that test actually fails against the signature, not key selection, by reading the assertion output.

- [ ] **Step 7: Mount the gate in `src/middleware.ts`.** Replace the body of `onRequest` so auth runs first:

```ts
import type { MiddlewareHandler } from "astro";
import { env } from "cloudflare:workers";
import { getDb } from "./db/client";
import { couldBeRedirect, resolveRedirect } from "./db/redirects";
import { requiresAuth, verifyAccessJwt } from "./lib/access";

export const onRequest: MiddlewareHandler = async (context, next) => {
  if (requiresAuth(context.url.pathname) && !import.meta.env.DEV) {
    const e = env as unknown as { ACCESS_TEAM_DOMAIN?: string; ACCESS_AUD?: string };
    const token = context.request.headers.get("cf-access-jwt-assertion");
    const email =
      token && e.ACCESS_TEAM_DOMAIN && e.ACCESS_AUD
        ? await verifyAccessJwt(token, {
            teamDomain: e.ACCESS_TEAM_DOMAIN,
            aud: e.ACCESS_AUD,
          })
        : null;
    if (!email) return new Response("Unauthorized", { status: 401 });
  }

  const response = await next();
  if (response.status !== 404) return response;
  if (!couldBeRedirect(context.url.pathname)) return response;
  const target = await resolveRedirect(getDb(), context.url.pathname);
  if (!target) return response;
  return context.redirect(target, 301);
};
```

Keep the existing file comments; add one line to the header comment: the auth gate for `/admin` runs before everything, and 401 is the answer wherever `ACCESS_TEAM_DOMAIN`/`ACCESS_AUD` are unset.

- [ ] **Step 8: Run the whole suite** — `npm test` — expected: PASS (nothing else exercises the middleware with admin paths).

- [ ] **Step 9: Commit**

```bash
git add wrangler.jsonc src/lib/access.ts src/middleware.ts test/access.test.ts
git commit -m "feat: verify Cloudflare Access JWTs in front of /admin"
```

---

### Task 2: Device derivation and the submissions data module

**Files:**
- Create: `src/lib/device.ts`
- Create: `src/db/submissions.ts`
- Test: `test/device.test.ts`, `test/submissions.test.ts`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `deriveDevice(ratio: number, devices: DeviceRange[]): string | null` where `DeviceRange = { slug: string; min_ratio: number | null; max_ratio: number | null; sort_order: number; is_active: number }`
- Produces (all take `db: D1Database` first):
  - `insertDraft(db, d: { id: string; r2Key: string; width: number; height: number; byteSize: number }): Promise<void>` — writes `source='admin'`, `status='pending'`, `aspect_ratio = width/height`, `created_at` now.
  - `getDraft(db, id: string): Promise<DraftRow | null>` — pending admin rows only.
  - `nextPendingDraft(db, excludeId?: string): Promise<string | null>` — oldest pending admin draft id.
  - `countPendingDrafts(db): Promise<number>`
  - `DraftRow = { id: string; r2_key: string; width: number; height: number; aspect_ratio: number; byte_size: number; created_at: string }`

- [ ] **Step 1: Write `test/device.test.ts` (failing):**

```ts
import { it, expect } from "vitest";
import { deriveDevice } from "../src/lib/device";

// Mirrors migrations/0001: overlapping ranges, first match by sort_order wins.
const DEVICES = [
  { slug: "phone", min_ratio: 0.4, max_ratio: 0.65, sort_order: 1, is_active: 1 },
  { slug: "tablet", min_ratio: 0.65, max_ratio: 1.5, sort_order: 2, is_active: 1 },
  { slug: "desktop", min_ratio: 1.2, max_ratio: 2.2, sort_order: 3, is_active: 1 },
  { slug: "tv", min_ratio: 1.5, max_ratio: 2.4, sort_order: 4, is_active: 1 },
  { slug: "console", min_ratio: 1.5, max_ratio: 2.4, sort_order: 5, is_active: 0 },
  { slug: "watch", min_ratio: 0.7, max_ratio: 1.3, sort_order: 6, is_active: 1 },
];

it("derives phone from an iPhone screenshot ratio", () => {
  expect(deriveDevice(1170 / 2532, DEVICES)).toBe("phone");
});

it("takes the first active range by sort_order when ranges overlap", () => {
  expect(deriveDevice(1.4, DEVICES)).toBe("tablet"); // tablet before desktop
  expect(deriveDevice(1.6, DEVICES)).toBe("desktop"); // desktop before tv
});

it("skips inactive device types", () => {
  const only = DEVICES.filter((d) => d.slug === "console" || d.slug === "tv");
  expect(deriveDevice(1.6, only)).toBe("tv");
});

it("returns null when nothing contains the ratio", () => {
  expect(deriveDevice(5.0, DEVICES)).toBeNull();
  expect(deriveDevice(0.2, DEVICES)).toBeNull();
});

it("returns null for a device whose range is unset", () => {
  expect(deriveDevice(0.5, [{ slug: "x", min_ratio: null, max_ratio: null, sort_order: 1, is_active: 1 }])).toBeNull();
});
```

- [ ] **Step 2: Run** `npm test -- device` — expected: FAIL.

- [ ] **Step 3: Implement `src/lib/device.ts`:**

```ts
/**
 * Which device a screenshot's shape suggests.
 *
 * The ranges in `device_types` overlap deliberately (0001_taxonomies.sql), so
 * "first active match by sort_order" is the rule, and the capture screen
 * shows the answer as a confirmable pre-selection — never a silent write.
 */

export type DeviceRange = {
  slug: string;
  min_ratio: number | null;
  max_ratio: number | null;
  sort_order: number;
  is_active: number;
};

export function deriveDevice(ratio: number, devices: DeviceRange[]): string | null {
  const match = devices
    .filter((d) => d.is_active === 1 && d.min_ratio !== null && d.max_ratio !== null)
    .sort((a, b) => a.sort_order - b.sort_order)
    .find((d) => ratio >= (d.min_ratio as number) && ratio <= (d.max_ratio as number));
  return match?.slug ?? null;
}
```

- [ ] **Step 4: Run** `npm test -- device` — expected: PASS.

- [ ] **Step 5: Write `test/submissions.test.ts` (failing):**

```ts
import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { it, expect, beforeAll } from "vitest";
import {
  insertDraft, getDraft, nextPendingDraft, countPendingDrafts,
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
});

it("getDraft ignores non-pending and non-admin rows", async () => {
  await env.DB.prepare(
    `INSERT INTO submissions (id, status, source, r2_key, created_at)
     VALUES ('pub1','pending','public','submissions/pub1.png','2026-01-01T00:00:00Z')`,
  ).run();
  expect(await getDraft(env.DB, "pub1")).toBeNull();
});
```

- [ ] **Step 6: Run** `npm test -- submissions` — expected: FAIL.

- [ ] **Step 7: Implement `src/db/submissions.ts`:**

```ts
/**
 * The admin's reads and writes of `submissions`.
 *
 * A draft is a pending admin-sourced row: the image is in R2 and measured,
 * and the metadata is still owed. The review queue (#35) reads the same
 * table, so these stay narrow — admin rows only, pending only.
 */

export type DraftRow = {
  id: string;
  r2_key: string;
  width: number;
  height: number;
  aspect_ratio: number;
  byte_size: number;
  created_at: string;
};

const DRAFT = "source = 'admin' AND status = 'pending'";

export async function insertDraft(
  db: D1Database,
  d: { id: string; r2Key: string; width: number; height: number; byteSize: number },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO submissions
         (id, status, source, r2_key, width, height, aspect_ratio, byte_size, created_at)
       VALUES (?, 'pending', 'admin', ?, ?, ?, ?, ?, ?)`,
    )
    .bind(d.id, d.r2Key, d.width, d.height, d.width / d.height, d.byteSize,
          new Date().toISOString())
    .run();
}

export async function getDraft(db: D1Database, id: string): Promise<DraftRow | null> {
  return db
    .prepare(
      `SELECT id, r2_key, width, height, aspect_ratio, byte_size, created_at
         FROM submissions WHERE id = ? AND ${DRAFT}`,
    )
    .bind(id)
    .first<DraftRow>();
}

export async function nextPendingDraft(
  db: D1Database,
  excludeId?: string,
): Promise<string | null> {
  const row = await db
    .prepare(
      `SELECT id FROM submissions
        WHERE ${DRAFT} AND id != ?
        ORDER BY created_at ASC, id ASC LIMIT 1`,
    )
    .bind(excludeId ?? "")
    .first<{ id: string }>();
  return row?.id ?? null;
}

export async function countPendingDrafts(db: D1Database): Promise<number> {
  const row = await db
    .prepare(`SELECT COUNT(*) AS n FROM submissions WHERE ${DRAFT}`)
    .first<{ n: number }>();
  return row?.n ?? 0;
}
```

- [ ] **Step 8: Run** `npm test -- submissions` — expected: PASS. Then `npm test` — expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/lib/device.ts src/db/submissions.ts test/device.test.ts test/submissions.test.ts
git commit -m "feat: derive device from shape and read admin drafts"
```

---

### Task 3: Upload — orchestration and route

**Files:**
- Create: `src/lib/admin.ts`
- Create: `src/pages/api/admin/upload.ts`
- Test: `test/admin-upload.test.ts`

**Interfaces:**
- Consumes: `insertDraft` (Task 2).
- Produces in `src/lib/admin.ts`:

```ts
export type ImagesLike = {
  info(stream: ReadableStream): Promise<{ format: string; width: number; height: number; fileSize?: number }>;
  input(stream: ReadableStream): {
    transform(t: { width: number }): {
      output(o: { format: string; quality: number }): Promise<{ response(): Response }>;
    };
  };
};
export type AdminEnv = { db: D1Database; media: R2Bucket; images: ImagesLike };
export async function handleUpload(env: AdminEnv, file: File): Promise<
  { ok: true; id: string; url: string } | { ok: false; status: number; error: string }
>;
```

- `env.IMAGES` satisfies `ImagesLike` structurally; the route casts once.

- [ ] **Step 1: Write `test/admin-upload.test.ts` (failing).** The fake images object answers `info()` from fixture bytes; R2 and D1 are real:

```ts
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
```

- [ ] **Step 2: Run** `npm test -- admin-upload` — expected: FAIL.

- [ ] **Step 3: Implement the upload half of `src/lib/admin.ts`:**

```ts
/**
 * Admin capture: upload and publish orchestration.
 *
 * Bindings arrive as parameters (the `src/db` convention), so the whole flow
 * runs under vitest with a fake Images implementation — the binding's local
 * polyfill is not available inside the test pool, and nothing here should
 * depend on it.
 */

import { ulid } from "ulidx";
import { insertDraft } from "../db/submissions";

export type ImagesLike = {
  info(stream: ReadableStream): Promise<{ format: string; width: number; height: number; fileSize?: number }>;
  input(stream: ReadableStream): {
    transform(t: { width: number }): {
      output(o: { format: string; quality: number }): Promise<{ response(): Response }>;
    };
  };
};

export type AdminEnv = { db: D1Database; media: R2Bucket; images: ImagesLike };

/** Formats the Images binding accepts as input and the gallery can serve. */
const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/avif": "avif",
};

const MAX_BYTES = 20 * 1024 * 1024; // the Images binding's input ceiling

export async function handleUpload(
  env: AdminEnv,
  file: File,
): Promise<{ ok: true; id: string; url: string } | { ok: false; status: number; error: string }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength === 0) return { ok: false, status: 400, error: "Empty file" };
  if (bytes.byteLength > MAX_BYTES) return { ok: false, status: 413, error: "Over 20 MB" };

  // The bytes are the authority on format and dimensions; the client's
  // claimed content type is discarded (spec 02's rule).
  let info: { format: string; width: number; height: number };
  try {
    info = await env.images.info(streamOf(bytes));
  } catch {
    return { ok: false, status: 415, error: "Not a decodable image" };
  }
  const ext = EXT[info.format];
  if (!ext) return { ok: false, status: 415, error: `Unsupported format ${info.format}` };

  const id = ulid();
  const r2Key = `submissions/${id}.${ext}`;
  await env.media.put(r2Key, bytes, { httpMetadata: { contentType: info.format } });
  await insertDraft(env.db, {
    id, r2Key, width: info.width, height: info.height, byteSize: bytes.byteLength,
  });

  return { ok: true, id, url: `/admin/new?draft=${id}` };
}

export function streamOf(bytes: Uint8Array): ReadableStream {
  return new Blob([bytes]).stream();
}
```

- [ ] **Step 4: Run** `npm test -- admin-upload` — expected: PASS.

- [ ] **Step 5: Create the thin route `src/pages/api/admin/upload.ts`:**

```ts
/**
 * POST one image, get a draft back. Both entry points call this: the picker
 * on /admin/new and the iOS Shortcut (docs/shortcut.md). Auth happens in the
 * middleware; by the time this runs the request carries a verified Access
 * identity.
 */

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { handleUpload, type ImagesLike } from "../../../lib/admin";

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Send multipart form data with a 'file' part" }, { status: 400 });
  }

  const e = env as unknown as { DB: D1Database; MEDIA: R2Bucket; IMAGES: ImagesLike };
  const result = await handleUpload({ db: e.DB, media: e.MEDIA, images: e.IMAGES }, file);
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ id: result.id, url: result.url });
};
```

- [ ] **Step 6: Run** `npm test` — expected: PASS (`source.test.ts` reads sources; confirm nothing in it asserts over `src/pages/api` in a way that breaks).

- [ ] **Step 7: Commit**

```bash
git add src/lib/admin.ts src/pages/api/admin/upload.ts test/admin-upload.test.ts
git commit -m "feat: accept an admin image upload into a pending draft"
```

---

### Task 4: Publish — orchestration and route

**Files:**
- Modify: `src/lib/admin.ts`
- Create: `src/pages/api/admin/publish.ts`
- Test: `test/admin-publish.test.ts`

**Interfaces:**
- Consumes: `getDraft`, `nextPendingDraft` (Task 2); `writeFtsRow` (`src/db/fts.ts`); `slugify`, `dedupeSlug` (`src/lib/slug.ts`); `variantsFor`, `variantKey` (`src/lib/variants.ts`); `ImagesLike`, `AdminEnv`, `streamOf` (Task 3).
- Produces:

```ts
export type PublishFields = {
  title: string; appName: string; appUrl?: string;
  deviceType: string; os: string; tagSlugs: string[];
};
export async function handlePublish(env: AdminEnv, draftId: string, f: PublishFields): Promise<
  { ok: true; slug: string; nextDraft: string | null } | { ok: false; status: number; error: string }
>;
```

- [ ] **Step 1: Write `test/admin-publish.test.ts` (failing):**

```ts
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
```

- [ ] **Step 2: Run** `npm test -- admin-publish` — expected: FAIL.

- [ ] **Step 3: Add the publish half to `src/lib/admin.ts`:**

```ts
import { getDraft, nextPendingDraft } from "../db/submissions";
import { writeFtsRow } from "../db/fts";
import { slugify, dedupeSlug } from "./slug";
import { variantsFor, variantKey } from "./variants";

const VARIANT_QUALITY = 82; // spec 02, matching scripts/build-variants.ts

export type PublishFields = {
  title: string;
  appName: string;
  appUrl?: string;
  deviceType: string;
  os: string;
  tagSlugs: string[];
};

export async function handlePublish(
  env: AdminEnv,
  draftId: string,
  f: PublishFields,
): Promise<
  { ok: true; slug: string; nextDraft: string | null } | { ok: false; status: number; error: string }
> {
  const missing = [
    !f.title?.trim() && "title",
    !f.appName?.trim() && "app name",
    !f.deviceType && "device",
    !f.os && "os",
    f.tagSlugs.length === 0 && "tags",
  ].filter(Boolean);
  if (missing.length) return { ok: false, status: 422, error: `Missing: ${missing.join(", ")}` };

  const draft = await getDraft(env.db, draftId);
  if (!draft) return { ok: false, status: 404, error: "No pending draft with that id" };

  const tags = (
    await env.db
      .prepare(
        `SELECT id, slug, label FROM tags WHERE slug IN (${f.tagSlugs.map(() => "?").join(",")})`,
      )
      .bind(...f.tagSlugs)
      .all<{ id: number; slug: string; label: string }>()
  ).results;
  if (tags.length !== f.tagSlugs.length) {
    return { ok: false, status: 422, error: "Unknown tag" };
  }

  // Same collision rule as the importer: base slug, then -2, -3, ...
  const base = slugify(f.title.trim(), f.appName.trim());
  const taken = new Set(
    (
      await env.db
        .prepare("SELECT slug FROM states WHERE slug = ? OR slug LIKE ? || '-%'")
        .bind(base, base)
        .all<{ slug: string }>()
    ).results.map((r) => r.slug),
  );
  const slug = dedupeSlug(base, taken);

  // R2 first, D1 batch second, source delete last: a failure anywhere before
  // the batch leaves a pending draft whose retry overwrites these same keys
  // (the state id is the draft id), and no partial states row can exist.
  const source = await env.media.get(draft.r2_key);
  if (!source) return { ok: false, status: 500, error: "Draft image missing from R2" };
  const bytes = new Uint8Array(await source.arrayBuffer());
  const contentType = source.httpMetadata?.contentType ?? "application/octet-stream";
  const ext = draft.r2_key.split(".").pop() as string;
  const originalKey = `originals/${draft.id}.${ext}`;
  await env.media.put(originalKey, bytes, { httpMetadata: { contentType } });

  for (const w of variantsFor(draft.width)) {
    const out = await env.images
      .input(streamOf(bytes))
      .transform({ width: w })
      .output({ format: "image/webp", quality: VARIANT_QUALITY });
    const body = new Uint8Array(await out.response().arrayBuffer());
    await env.media.put(variantKey(w, draft.id), body, {
      httpMetadata: { contentType: "image/webp" },
    });
  }

  const now = new Date().toISOString();
  await env.db.batch([
    env.db
      .prepare(
        `INSERT INTO states
           (id, slug, title, app_name, app_url, device_type, os, r2_key,
            width, height, aspect_ratio, byte_size, status, is_legacy,
            published_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 0, ?, ?)`,
      )
      .bind(
        draft.id, slug, f.title.trim(), f.appName.trim(), f.appUrl?.trim() || null,
        f.deviceType, f.os, originalKey,
        draft.width, draft.height, draft.aspect_ratio, draft.byte_size,
        now, now,
      ),
    ...tags.map((t) =>
      env.db
        .prepare("INSERT INTO state_tags (state_id, tag_id) VALUES (?, ?)")
        .bind(draft.id, t.id),
    ),
    ...writeFtsRow(env.db, {
      stateId: draft.id,
      title: f.title.trim(),
      appName: f.appName.trim(),
      tags: tags.map((t) => t.label).join(" "),
    }),
    env.db
      .prepare(
        `UPDATE submissions
            SET status = 'approved', title = ?, app_name = ?, device_type = ?,
                os = ?, tags_json = ?, reviewed_at = ?, published_state_id = ?
          WHERE id = ?`,
      )
      .bind(
        f.title.trim(), f.appName.trim(), f.deviceType, f.os,
        JSON.stringify(f.tagSlugs), now, draft.id, draft.id,
      ),
  ]);

  // Best-effort: a stray submissions/ object under a published row is the
  // acceptable failure mode; a deleted source under a pending draft is not.
  await env.media.delete(draft.r2_key);

  return { ok: true, slug, nextDraft: await nextPendingDraft(env.db, draft.id) };
}
```

- [ ] **Step 4: Run** `npm test -- admin-publish` — expected: PASS. The variant-failure test expects a **rejection** (the route turns it into a 500); confirm the draft stays pending and the retry test passes.

- [ ] **Step 5: Create `src/pages/api/admin/publish.ts`:**

```ts
/**
 * Publish a draft. A plain form POST — the capture screen works without any
 * client JavaScript on this step. 303 so the browser lands on the next draft
 * or the published entry with a GET.
 */

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { handlePublish, type ImagesLike } from "../../../lib/admin";

export const POST: APIRoute = async ({ request, url }) => {
  const form = await request.formData().catch(() => null);
  if (!form) return new Response("Bad request", { status: 400 });

  const draftId = String(form.get("draft") ?? "");
  const e = env as unknown as { DB: D1Database; MEDIA: R2Bucket; IMAGES: ImagesLike };

  let result;
  try {
    result = await handlePublish(
      { db: e.DB, media: e.MEDIA, images: e.IMAGES },
      draftId,
      {
        title: String(form.get("title") ?? ""),
        appName: String(form.get("app_name") ?? ""),
        appUrl: String(form.get("app_url") ?? "") || undefined,
        deviceType: String(form.get("device_type") ?? ""),
        os: String(form.get("os") ?? ""),
        tagSlugs: form.getAll("tags").map(String),
      },
    );
  } catch {
    // The draft is still pending; send the phone back to it to retry.
    return Response.redirect(new URL(`/admin/new?draft=${draftId}&error=retry`, url), 303);
  }

  if (!result.ok) {
    const q = new URLSearchParams({ draft: draftId, error: result.error });
    return Response.redirect(new URL(`/admin/new?${q}`, url), 303);
  }
  const dest = result.nextDraft
    ? `/admin/new?draft=${result.nextDraft}&published=${result.slug}`
    : `/s/${result.slug}`;
  return Response.redirect(new URL(dest, url), 303);
};
```

- [ ] **Step 6: Run** `npm test` — expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/admin.ts src/pages/api/admin/publish.ts test/admin-publish.test.ts
git commit -m "feat: publish a draft into states with variants, live on commit"
```

---

### Task 5: The capture screen and manifest

**Files:**
- Create: `src/pages/admin/new.astro`
- Create: `public/manifest.webmanifest`
- Modify: `src/db/taxonomies.ts` (add three small reads)
- Test: `test/admin-page.test.ts`

**Interfaces:**
- Consumes: `getDraft`, `countPendingDrafts` (Task 2); `deriveDevice` (Task 2); `mediaUrl` (`src/lib/media.ts`).
- Produces in `src/db/taxonomies.ts` (all take `db: D1Database`):
  - `listDeviceRanges(db): Promise<DeviceRange[]>` — `SELECT slug, label, min_ratio, max_ratio, sort_order, is_active FROM device_types WHERE is_active = 1 ORDER BY sort_order` (type widened locally with `label: string`)
  - `listOsOptions(db): Promise<{ slug: string; label: string }[]>` — active, by sort_order
  - `listTagOptions(db): Promise<{ slug: string; label: string }[]>` — all tags by label
  - `listAppNames(db): Promise<string[]>` — `SELECT DISTINCT app_name FROM states WHERE app_name IS NOT NULL ORDER BY app_name`

- [ ] **Step 1: Write `test/admin-page.test.ts` (failing).** Data-layer tests plus source assertions in the repo's `source.test.ts` style:

```ts
import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { it, expect, beforeAll } from "vitest";
import {
  listDeviceRanges, listOsOptions, listTagOptions, listAppNames,
} from "../src/db/taxonomies";

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  await env.DB.prepare(
    `INSERT INTO states (id, slug, title, app_name, device_type, r2_key, width,
       height, aspect_ratio, byte_size, published_at, created_at)
     VALUES ('a1','x','X','Feedly','phone','originals/a1.png',10,20,0.5,1,
             '2026-01-01T00:00:00Z','2026-01-01T00:00:00Z')`,
  ).run();
  await env.DB.prepare("INSERT INTO tags (slug, label) VALUES ('empty-cart','Empty cart')").run();
});

it("lists active device ranges in sort order", async () => {
  const d = await listDeviceRanges(env.DB);
  expect(d[0].slug).toBe("phone");
  expect(d.every((x) => x.is_active === 1)).toBe(true);
});

it("lists OS options and tag options", async () => {
  expect((await listOsOptions(env.DB)).map((o) => o.slug)).toContain("ios");
  expect((await listTagOptions(env.DB)).map((t) => t.slug)).toContain("empty-cart");
});

it("lists distinct app names for the datalist", async () => {
  expect(await listAppNames(env.DB)).toEqual(["Feedly"]);
});

// The page itself renders in workerd, so assert over its source the way
// source.test.ts does: the load-bearing attributes must exist.
const page = Object.entries(env.TEST_SOURCES as Record<string, string>).find(([p]) =>
  p.endsWith("src/pages/admin/new.astro"),
)?.[1] as string;

it("uploads via the picker and publishes via a plain form", () => {
  expect(page).toContain('type="file"');
  expect(page).toContain('accept="image/*"');
  expect(page).toContain("multiple");
  expect(page).toContain('action="/api/admin/publish"');
  expect(page).toContain('method="POST"');
  expect(page).toMatch(/name="tags"/);
  expect(page).toContain("manifest.webmanifest");
});
```

- [ ] **Step 2: Run** `npm test -- admin-page` — expected: FAIL.

- [ ] **Step 3: Add the four reads to `src/db/taxonomies.ts`** (follow the file's existing style; each is a single prepared statement, no joins needed except none).

- [ ] **Step 4: Write `src/pages/admin/new.astro`.** Structure (Tailwind 4 utilities, mobile-first, match `Base.astro`'s conventions but do **not** use `Base.astro` — the admin needs no site header/footer/canonical; a minimal self-contained layout in the file is right):

```astro
---
import "../../styles/global.css";
import { getDb } from "../../db/client";
import { getDraft, countPendingDrafts } from "../../db/submissions";
import {
  listDeviceRanges, listOsOptions, listTagOptions, listAppNames,
} from "../../db/taxonomies";
import { deriveDevice } from "../../lib/device";
import { mediaUrl } from "../../lib/media";

const db = getDb();
const draftId = Astro.url.searchParams.get("draft");
const error = Astro.url.searchParams.get("error");
const published = Astro.url.searchParams.get("published");

const draft = draftId ? await getDraft(db, draftId) : null;
const pending = await countPendingDrafts(db);

const [devices, oses, tagOptions, appNames] = draft
  ? await Promise.all([
      listDeviceRanges(db), listOsOptions(db), listTagOptions(db), listAppNames(db),
    ])
  : [[], [], [], []];
const derived = draft ? deriveDevice(draft.aspect_ratio, devices) : null;
---
```

Page body requirements (write real markup for each; no component extraction — one screen, one file):

1. `<head>`: `<meta name="viewport" content="width=device-width, initial-scale=1">`, `<link rel="manifest" href="/manifest.webmanifest">`, `<meta name="robots" content="noindex">`, title "New state — admin".
2. **Picker mode** (`!draft`): a large tap target labelled "Add screenshots" wrapping `<input type="file" name="file" accept="image/*" multiple class="sr-only">`; an inline `<script>` that on `change` uploads files sequentially with `fetch("/api/admin/upload", { method: "POST", body: formData })`, shows per-file progress text, and navigates to the first response's `url` when all are done. If `draftId` was given but the draft is gone (published elsewhere), fall through to this mode with a "Draft already published" note. Show `pending` if > 0 with a "Continue" link to the oldest (link target `/admin/new?draft=next` is unnecessary — server already knows; render the link directly from `nextPendingDraft` only if you add that call, otherwise omit).
3. **Edit mode** (`draft`): top strip shows "n more" when `pending > 1` and a "published <slug>" confirmation when `published` is set; the image as `<img src={mediaUrl(draft.r2_key)} alt="">` with `max-height: 45vh; object-fit: contain`; then the form `method="POST" action="/api/admin/publish"` containing `<input type="hidden" name="draft" value={draft.id}>`, device radios (derived one `checked`, none checked when `derived` is null), OS radios (none checked), app name `<input name="app_name" list="apps" required autocapitalize="words">` + `<datalist id="apps">`, title `<input name="title" required placeholder="No results in Feedly">`, tag checkboxes styled as chips (`<label><input type="checkbox" name="tags" value={t.slug} class="peer sr-only"><span class="peer-checked:...">{t.label}</span></label>`), optional `<input name="app_url" type="url" inputmode="url">`, and a full-width submit button "Publish" pinned last with generous padding (`py-4`, thumb reach). Show `error` in a visible strip when present.
4. Radios and checkboxes are native inputs; the only JavaScript on the page is the picker-mode upload script.

- [ ] **Step 5: Create `public/manifest.webmanifest`:**

```json
{
  "name": "emptystat.es admin",
  "short_name": "emptystates",
  "start_url": "/admin/new",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ffffff",
  "icons": []
}
```

Before writing `icons`, run `ls public` — if an existing icon asset (e.g. `favicon.svg`, any `icon-*.png` or apple-touch-icon) is present, reference it; otherwise leave `icons: []` and add `<link rel="apple-touch-icon" ...>` only if an asset exists. Do not generate icon files.

- [ ] **Step 6: Run** `npm test -- admin-page` — expected: PASS. Then `npm test` — expected: PASS (`source.test.ts` and `deploy-safety.test.ts` both read all sources; fix anything they flag).

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin/new.astro src/db/taxonomies.ts public/manifest.webmanifest test/admin-page.test.ts
git commit -m "feat: the capture screen at /admin/new"
```

---

### Task 6: Shortcut recipe and Access setup doc

**Files:**
- Create: `docs/shortcut.md`

**Interfaces:** consumes nothing; documentation only.

- [ ] **Step 1: Write `docs/shortcut.md`** with these sections (documentation-prose voice: third-person impersonal):

1. **Access setup** — numbered, exact:
   - In Zero Trust → Access → Applications: add a self-hosted application covering `emptystat.es/admin` and `emptystat.es/api/admin` with a 30-day session and one Allow policy for the owner's email plus a Service Auth policy for the token below. Record the application's `aud` tag.
   - For staging: Workers dashboard → the `emptystates-v2` Worker → Domains & Routes → enable Access on the workers.dev subdomain; record that application's `aud`.
   - Create a service token (Zero Trust → Access → Service Auth); record client id and secret.
   - Set per-Worker secrets: `wrangler secret put ACCESS_TEAM_DOMAIN` and `wrangler secret put ACCESS_AUD` (staging uses the default config; production adds `--name emptystates`). The team domain is `<team>.cloudflareaccess.com`.
   - Until the two secrets are set, every `/admin` request answers 401 — the gate fails closed.
2. **The Shortcut** — numbered actions to build in the Shortcuts app:
   - New shortcut, "Receive Images and Screenshots from Share Sheet".
   - "Get Contents of URL": `https://emptystat.es/api/admin/upload`, method POST, request body Form, one field `file` of type File set to Shortcut Input; headers `CF-Access-Client-Id` and `CF-Access-Client-Secret` from the service token.
   - "Get Dictionary Value" for key `url`.
   - "Open URLs" on `https://emptystat.es` + that value.
   - Note: screenshots arrive as PNG; if a HEIC photo is ever rejected, insert a "Convert Image to PNG" action before the POST.
3. **Home screen** — open `/admin/new` in Safari, Share → Add to Home Screen.

- [ ] **Step 2: Commit**

```bash
git add docs/shortcut.md
git commit -m "docs: the capture Shortcut and Access setup"
```

---

### Task 7 (session-level, not for a subagent): verify, PR, staging deploy

- [ ] `npm test` — full suite green.
- [ ] `npm run build` — the Astro build succeeds with the new routes.
- [ ] Push `upload-admin`, open a PR against `v2` with the spec and plan linked and the Access setup checklist from `docs/shortcut.md` in the body.
- [ ] `npm run deploy` — staging (`emptystates-v2` on workers.dev, the default target).
- [ ] Report: PR URL, staging URL, and the two setup steps the dashboard still owes (Access apps + secrets) before `/admin` answers anything but 401.

## Self-Review Notes

- Spec section 2 (upload), 3 (screen), 4 (publish), 5 (Shortcut), 6 (config) map to Tasks 3, 5, 4, 6, 1. Spec section 1 (auth) is Task 1. Verification items about one-handed reach and the live Shortcut are manual, listed in the PR body.
- The spec's format list said PNG/JPEG/WebP/HEIC; Task 3 adds AVIF because the binding accepts it — a superset, consistent.
- `handleUpload`/`handlePublish` signatures match between Tasks 3, 4, and 5's consumption. `ImagesLike` is defined once in Task 3 and imported everywhere else.
