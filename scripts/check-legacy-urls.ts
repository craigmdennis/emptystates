/**
 * Checks every address the live Gatsby site publishes against the migrated
 * corpus.
 *
 *   npx tsx scripts/check-legacy-urls.ts
 *
 * A name that resolves nowhere is a link somebody has bookmarked and a 404
 * after the cutover. `test/legacy-urls.test.ts` covers the part a pure
 * function can decide; this needs the 235 rows the migration wrote, which the
 * Workers test pool does not have.
 *
 * `getPlatformProxy` reads the same local D1 that
 * `wrangler d1 migrations apply --local` and `scripts/migrate-legacy.ts`
 * write, so this reports on the database the site would serve.
 */

import { getPlatformProxy } from "wrangler";
import legacy from "../test/fixtures/legacy-urls.json" with { type: "json" };
import { resolveRedirect } from "../src/db/redirects";
import { resolveTagPath } from "../src/lib/tags";

const { env, dispose } = await getPlatformProxy<{ DB: D1Database }>({
  remoteBindings: false,
});

const { results } = await env.DB.prepare(
  "SELECT slug FROM states WHERE status = 'published'",
).all<{ slug: string }>();
const slugs = new Set(results.map((r) => r.slug));

if (slugs.size === 0) {
  console.error(
    "The local D1 has no published states. Run `npx tsx scripts/migrate-legacy.ts` first.",
  );
  await dispose();
  process.exit(1);
}

const dead: string[] = [];
let sameAddress = 0;
let redirected = 0;

for (const name of legacy.states) {
  if (slugs.has(name)) {
    sameAddress += 1;
    continue;
  }
  if (await resolveRedirect(env.DB, `/s/${name}`)) {
    redirected += 1;
    continue;
  }
  dead.push(`/s/${name}/`);
}

for (const name of legacy.retiredWithPages) {
  if (await resolveRedirect(env.DB, `/s/${name}`)) {
    redirected += 1;
    continue;
  }
  dead.push(`/s/${name}/`);
}

const unroutableTags = legacy.tags.filter((t) => resolveTagPath(t) === null);

const total = legacy.states.length + legacy.retiredWithPages.length;
console.log(`${slugs.size} published states in the local D1`);
console.log(`${total} entry addresses master publishes`);
console.log(`  ${sameAddress} answer at the same address`);
console.log(`  ${redirected} answer through a 301`);
console.log(`  ${dead.length} resolve nowhere`);
console.log(`${legacy.tags.length} tag paths, ${unroutableTags.length} unroutable`);

for (const path of dead) console.error(`  dead: ${path}`);
for (const tag of unroutableTags) console.error(`  unroutable tag: /tags/${tag}/`);

await dispose();
process.exit(dead.length + unroutableTags.length === 0 ? 0 : 1);
