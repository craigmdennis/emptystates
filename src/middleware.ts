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
 */

import type { MiddlewareHandler } from "astro";
import { getDb } from "./db/client";
import { resolveRedirect } from "./db/redirects";

// A type-only import, so this module loads outside Astro's build and its
// behaviour is testable. `defineMiddleware` from `astro:middleware` returns its
// argument unchanged and buys nothing but the annotation, while making the
// module unloadable anywhere the virtual module does not exist.
export const onRequest: MiddlewareHandler = async (context, next) => {
  const response = await next();
  if (response.status !== 404) return response;

  const target = await resolveRedirect(getDb(), context.url.pathname);
  if (!target) return response;

  return context.redirect(target, 301);
};
