/**
 * The one place a route reaches for D1.
 *
 * The Cloudflare adapter puts bindings on `locals.runtime.env`, which is an
 * Astro-shaped detail. Routes call `getDb(Astro.locals)` so the query modules
 * take a plain `D1Database` and stay callable from tests, scripts and the
 * Workers pool, none of which have an Astro request.
 */

export type RuntimeLocals = {
  runtime: { env: { DB: D1Database } };
};

export function getDb(locals: RuntimeLocals): D1Database {
  const db = locals?.runtime?.env?.DB;
  if (!db) {
    throw new Error(
      "No D1 binding on locals.runtime.env.DB — is the Cloudflare adapter configured?",
    );
  }
  return db;
}
