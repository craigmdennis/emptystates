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
 */
function readSources(dir: string, acc: Record<string, string> = {}) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) readSources(path, acc);
    else if (/\.(astro|ts|css)$/.test(entry.name))
      acc[path] = readFileSync(path, "utf8");
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
            TEST_SOURCES: readSources("src"),
          },
        },
      };
    }),
  ],
});
