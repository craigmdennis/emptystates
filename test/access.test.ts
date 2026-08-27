import { it, expect, describe, vi, afterEach } from "vitest";
import { accessToken, normalizePath, requiresAuth, verifyAccessJwt } from "../src/lib/access";

// The gate is skipped under `astro dev`, and vitest reports DEV as well, so
// the 401 path only runs with the flag stubbed off.
describe("the /admin gate outside dev", () => {
  afterEach(() => vi.unstubAllEnvs());

  async function run(path: string, headers: Record<string, string> = {}) {
    vi.stubEnv("DEV", false);
    const { onRequest } = await import("../src/middleware");
    const context = {
      url: new URL(`https://x${path}`),
      request: new Request(`https://x${path}`, { headers }),
      locals: {} as { admin?: boolean },
      redirect: () => new Response(null, { status: 301 }),
    };
    const res = (await onRequest(
      context as never,
      async () => new Response("ok", { status: 200 }),
    )) as Response;
    return { res, admin: context.locals.admin };
  }

  it("answers 401 to /admin/new without a token", async () => {
    const { res, admin } = await run("/admin/new");
    expect(res.status).toBe(401);
    expect(admin).toBe(false);
  });

  it("answers 401 to a token it cannot verify, header or cookie", async () => {
    expect((await run("/admin/new", { "cf-access-jwt-assertion": "a.b.c" })).res.status).toBe(401);
    expect((await run("/api/admin/upload", { cookie: "CF_Authorization=a.b.c" })).res.status).toBe(401);
  });

  it("serves a public page to a visitor with no token, admin false", async () => {
    const { res, admin } = await run("/s/some-slug");
    expect(res.status).toBe(200);
    expect(admin).toBe(false);
  });
});

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

  it("returns the client id for a service-token payload (no email claim)", async () => {
    const { token, jwk } = await makeToken({
      type: "app", aud: ["aud-tag"], exp: future,
      iss: "https://example.cloudflareaccess.com",
      common_name: "client-id-value", sub: "",
    });
    expect(await verifyAccessJwt(token, CFG, async () => [jwk])).toBe("client-id-value");
  });

  it("returns null for a verified token with no identity claims", async () => {
    const { token, jwk } = await makeToken({
      aud: ["aud-tag"], exp: future,
      iss: "https://example.cloudflareaccess.com",
    });
    expect(await verifyAccessJwt(token, CFG, async () => [jwk])).toBeNull();
  });
});

describe("requiresAuth", () => {
  it.each(["/admin", "/admin/new", "/api/admin/upload", "/api/admin/publish"])(
    "guards %s", (p) => expect(requiresAuth(p)).toBe(true),
  );
  it.each(["/", "/s/some-slug", "/administrator", "/api/other", "/img/w640/x.webp"])(
    "leaves %s open", (p) => expect(requiresAuth(p)).toBe(false),
  );

  it("is case-insensitive", () => {
    expect(requiresAuth("/Admin")).toBe(true);
  });
});

describe("normalizePath", () => {
  it("collapses duplicate leading slashes so //admin/new is gated", () => {
    expect(requiresAuth(normalizePath("//admin/new"))).toBe(true);
  });

  it("decodes percent-encoding so /%61dmin/new is gated", () => {
    expect(requiresAuth(normalizePath("/%61dmin/new"))).toBe(true);
  });

  it("does not gate a merely doubled-slash api path", () => {
    expect(requiresAuth(normalizePath("/api//admin"))).toBe(false);
  });

  it("does not throw on a malformed escape", () => {
    expect(() => normalizePath("/%ZZbad")).not.toThrow();
  });
});

describe("accessToken", () => {
  it("prefers the header Access adds on gated paths", () => {
    const req = new Request("https://x/admin/new", {
      headers: { "cf-access-jwt-assertion": "h.h.h", cookie: "CF_Authorization=c.c.c" },
    });
    expect(accessToken(req)).toBe("h.h.h");
  });

  it("falls back to the domain-wide cookie on a public page", () => {
    const req = new Request("https://x/s/slug", {
      headers: { cookie: "es:view=square; CF_Authorization=c.c.c; other=1" },
    });
    expect(accessToken(req)).toBe("c.c.c");
  });

  it("is null for a visitor", () => {
    expect(accessToken(new Request("https://x/s/slug"))).toBeNull();
    expect(accessToken(new Request("https://x/", { headers: { cookie: "a=1" } }))).toBeNull();
  });
});
