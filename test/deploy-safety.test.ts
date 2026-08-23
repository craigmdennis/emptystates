import { it, expect } from "vitest";
import { env } from "cloudflare:workers";

/**
 * The rules that keep a deploy off the live site by accident.
 *
 * On 2026-08-23 `wrangler deploy --env staging` replaced the Gatsby site
 * serving emptystat.es. The Astro adapter flattens `wrangler.jsonc` into
 * `dist/server/wrangler.json` and drops the `env` block while keeping
 * `definedEnvironments`, so the flag validated, found no environment to
 * apply, and fell through to the top-level `name`.
 *
 * Two rules follow, and nothing but this file enforces them. Both read the
 * config text out of `TEST_SOURCES`, since workerd has no filesystem.
 */
const sources = env.TEST_SOURCES;

/** Comment lines. The config is jsonc and its comments discuss both names. */
const isComment = (line: string) => /^\s*\/\//.test(line);

function configLines(): string[] {
  const text = sources["wrangler.jsonc"] ?? "";
  expect(text, "wrangler.jsonc is missing from TEST_SOURCES").not.toBe("");
  return text.split("\n").filter((line) => !isComment(line));
}

// The safe name on top means the worst case of a wrong flag is a staging
// deploy. `scripts/deploy.ts` reads this name back and refuses to run when it
// says anything else.
it("names the staging Worker at the top level", () => {
  const nameLine = configLines().find((line) => /"name"\s*:/.test(line));
  expect(nameLine?.trim()).toBe('"name": "emptystates-v2",');
});

// An `env` block reads as though `--env` works here. It does not: the adapter
// drops it, and the flag then applies nothing.
it("declares no environments, which a build would discard", () => {
  const offenders = configLines().filter((line) => /"env"\s*:/.test(line));
  expect(offenders, `wrangler.jsonc declares an env block: ${offenders.join(", ")}`).toEqual([]);
});

// Every deploy goes through the script, so the production path keeps its
// confirmation. A raw `wrangler deploy` in package.json would route around it.
it("routes every deploy through scripts/deploy.ts", () => {
  const pkg = JSON.parse(sources["package.json"] ?? "{}") as {
    scripts?: Record<string, string>;
  };
  const raw = Object.entries(pkg.scripts ?? {})
    .filter(([, cmd]) => /wrangler\s+deploy/.test(cmd))
    .map(([name]) => name);

  expect(raw, `these call wrangler deploy directly: ${raw.join(", ")}`).toEqual([]);
});

it("offers a staging deploy and a production deploy", () => {
  const pkg = JSON.parse(sources["package.json"] ?? "{}") as {
    scripts?: Record<string, string>;
  };
  expect(pkg.scripts?.deploy).toContain("scripts/deploy.ts");
  expect(pkg.scripts?.["deploy:production"]).toContain("--production");
});
