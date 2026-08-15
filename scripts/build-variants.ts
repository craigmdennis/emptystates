/**
 * Writes the WebP display variants for every published state.
 *
 *   npx tsx scripts/build-variants.ts --dry-run    # count what would be written
 *   npx tsx scripts/build-variants.ts              # write the missing ones
 *   npx tsx scripts/build-variants.ts --force      # rewrite them all
 *   npx tsx scripts/build-variants.ts --only <slug>
 *
 * Step 3 of spec 02's ingest pipeline, pulled forward and unchanged: WebP at
 * 640, 1280 and 2560 wide, quality 82, never upscaled. The upload path calls
 * `variantsFor` and `variantKey` too, so a variant written here and one written
 * by a future submission agree on both the width set and the key.
 *
 * Originals are never modified. Anything already present is skipped, so adding
 * one entry costs one render.
 */

import sharp from "sharp";
import { getPlatformProxy } from "wrangler";
import { listStates } from "../src/db/states";
import { variantKey, variantsFor } from "../src/lib/variants";

const QUALITY = 82;
const PAGE = 100;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const force = args.includes("--force");
const onlyIndex = args.indexOf("--only");
const only = onlyIndex === -1 ? null : args[onlyIndex + 1];

const { env, dispose } = await getPlatformProxy<{
  DB: D1Database;
  MEDIA: R2Bucket;
}>({ remoteBindings: false });

try {
  const states = [];
  for (let page = 1; ; page++) {
    const { rows, total } = await listStates(env.DB, { page, perPage: PAGE });
    states.push(...rows);
    if (states.length >= total || rows.length === 0) break;
  }

  const targets = only ? states.filter((s) => s.slug === only) : states;
  if (only && targets.length === 0) {
    console.error(`No published state with slug '${only}'.`);
    process.exit(1);
  }

  console.log(
    `${targets.length} states — ${dryRun ? "dry run" : force ? "rewriting all" : "writing missing"}`,
  );

  let written = 0;
  let skipped = 0;
  let tooNarrow = 0;
  const missingOriginals: string[] = [];

  for (const state of targets) {
    const widths = variantsFor(state.width);
    if (widths.length === 0) {
      // Narrower than 640. srcset falls back to the largest variant that
      // exists, which for these is the original.
      tooNarrow++;
      continue;
    }

    // Only fetch the original once a variant actually needs writing: on a
    // re-run with nothing to do, this reads no image bytes at all.
    let original: ArrayBuffer | null = null;

    for (const width of widths) {
      const key = variantKey(width, state.id);

      if (!force && (await env.MEDIA.head(key))) {
        skipped++;
        continue;
      }
      if (dryRun) {
        written++;
        continue;
      }

      if (!original) {
        const object = await env.MEDIA.get(state.r2_key);
        if (!object) {
          missingOriginals.push(`${state.slug} (${state.r2_key})`);
          break;
        }
        original = await object.arrayBuffer();
      }

      const body = await sharp(Buffer.from(original))
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toBuffer();

      await env.MEDIA.put(key, body, {
        httpMetadata: { contentType: "image/webp" },
      });
      written++;
    }
  }

  console.log("");
  console.log(`  written        ${written}`);
  console.log(`  already there  ${skipped}`);
  console.log(`  under 640 wide ${tooNarrow} (served their original)`);
  if (missingOriginals.length) {
    console.log(`  missing original ${missingOriginals.length}`);
    for (const m of missingOriginals) console.log(`    ${m}`);
  }
  console.log("");
  console.log(
    dryRun
      ? "Dry run. Nothing was written. Drop --dry-run to write."
      : "Done. Images resolve locally once PUBLIC_MEDIA_BASE points at /img.",
  );
} finally {
  await dispose();
}
