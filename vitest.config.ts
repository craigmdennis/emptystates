import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  cloudflareTest,
  readD1Migrations,
} from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

/**
 * Every source file, read at config time and handed to the suite as a binding.
 *
 * `source.test.ts` checks the templates themselves rather than what they
 * render, and workerd has no filesystem — the same reason the migrations are
 * read out here and passed in.
 *
 * `match` decides which files a directory contributes, so the same walk reads
 * `src` and the workflow directory. Reading the whole workflow directory
 * rather than three named files is what makes `deploy-safety.test.ts` cover a
 * workflow added later.
 */
function readSources(
  dir: string,
  match: RegExp,
  acc: Record<string, string> = {},
) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) readSources(path, match, acc);
    else if (match.test(entry.name)) acc[path] = readFileSync(path, "utf8");
  }
  return acc;
}

export default defineConfig({
  plugins: [
    cloudflareTest(async () => {
      // Read migrations at config time and expose them as a test-only binding,
      // so each suite applies them to its own isolated D1 instance.
      const migrations = await readD1Migrations("./migrations");
      return {
        wrangler: { configPath: "./wrangler.jsonc" },
        miniflare: {
          bindings: {
            TEST_MIGRATIONS: migrations,
            TEST_SOURCES: {
              ...readSources("src", /\.(astro|ts|css)$/),
              // `deploy-safety.test.ts` reads every file that decides which
              // Worker a deploy reaches.
              ...readSources(".github/workflows", /\.ya?ml$/),
              "wrangler.jsonc": readFileSync("wrangler.jsonc", "utf8"),
              "package.json": readFileSync("package.json", "utf8"),
              "scripts/deploy.ts": readFileSync("scripts/deploy.ts", "utf8"),
            },
          },
        },
      };
    }),
  ],
});
