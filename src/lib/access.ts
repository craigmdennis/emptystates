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
  return /^\/(?:api\/)?admin(?:\/|$)/i.test(pathname);
}

/**
 * Normalizes a raw request path the same way Astro's router does before
 * matching: collapse duplicate leading slashes, then decodeURI. A path the
 * router would resolve to `/admin*` must be gated even as `//admin/new` or
 * `/%61dmin/new`, so this has to run before `requiresAuth`, not after.
 *
 * A malformed escape fails closed: the collapsed-but-undecoded path is
 * returned rather than thrown, so a guarded route (matched pre-decode by
 * `requiresAuth`'s own regex) still 401s instead of erroring past the check.
 */
/**
 * The Access JWT a request carries, if any. Access puts it in a header on
 * paths its application covers, and in the `CF_Authorization` cookie for the
 * whole domain after a login, which is how a public page can tell the admin
 * apart from a visitor.
 */
export function accessToken(request: Request): string | null {
  const header = request.headers.get("cf-access-jwt-assertion");
  if (header) return header;
  const m = /(?:^|;\s*)CF_Authorization=([^;]+)/.exec(request.headers.get("cookie") ?? "");
  return m ? m[1] : null;
}

export function normalizePath(pathname: string): string {
  const collapsed = pathname.replace(/^\/{2,}/, "/");
  try {
    return decodeURI(collapsed);
  } catch {
    return collapsed;
  }
}

function b64urlToBytes(s: string): Uint8Array<ArrayBuffer> {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
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
      common_name?: string;
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

    // Service tokens carry no `email`: `common_name` is the client id, and
    // `sub` is often an empty string rather than absent, so `||` (not `??`)
    // is what actually falls through it.
    return payload.email ?? payload.common_name ?? (payload.sub || null);
  } catch {
    return null;
  }
}
