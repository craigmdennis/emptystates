/**
 * Serves the retired URLs.
 *
 * `state_redirects` holds 213 paths that resolved on the old site and name no
 * route here. Checking after the response comes back means a live route always
 * wins and the database is only consulted on a miss, so the 235 pages that do
 * exist pay nothing for this.
 *
 * 301 and not 302: these moved when the migration renamed them, and they are
 * not moving again.
 *
 * The auth gate for `/admin` runs before everything, and 401 is the answer
 * wherever `ACCESS_TEAM_DOMAIN`/`ACCESS_AUD` are unset.
 */

import type { MiddlewareHandler } from "astro";
import { env } from "cloudflare:workers";
import { getDb } from "./db/client";
import { couldBeRedirect, resolveRedirect } from "./db/redirects";
import { normalizePath, requiresAuth, verifyAccessJwt } from "./lib/access";

// A type-only import, so this module loads outside Astro's build and its
// behaviour is testable. `defineMiddleware` from `astro:middleware` returns its
// argument unchanged and buys nothing but the annotation, while making the
// module unloadable anywhere the virtual module does not exist.
export const onRequest: MiddlewareHandler = async (context, next) => {
  if (requiresAuth(normalizePath(context.url.pathname)) && !import.meta.env.DEV) {
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

  // Most 404s are scanners probing for paths no redirect could claim, and each
  // one cost a D1 read. The cheap test runs first.
  if (!couldBeRedirect(context.url.pathname)) return response;

  const target = await resolveRedirect(getDb(), context.url.pathname);
  if (!target) return response;

  return context.redirect(target, 301);
};
