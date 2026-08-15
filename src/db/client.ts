/**
 * The one place a route reaches for D1.
 *
 * Astro 6 removed `Astro.locals.runtime.env`, so the binding comes off the
 * Workers runtime import. That import only resolves inside workerd, which is
 * why this is the only module under `src/db/` to use it: the query modules take
 * a plain `D1Database` and stay callable from the Node scripts under
 * `scripts/`, which reach the same local database through `getPlatformProxy()`.
 */

import { env } from "cloudflare:workers";

export function getDb(): D1Database {
  const db = env.DB;
  if (!db) {
    throw new Error(
      "No DB binding on the Workers env — check d1_databases in wrangler.jsonc",
    );
  }
  return db;
}
