/**
 * The staging deploy, and the only deploy a developer machine can perform.
 *
 *   npm run deploy    # emptystates-v2.craig-8d2.workers.dev
 *
 * emptystat.es is published by `.github/workflows/production.yml`, from a tag,
 * behind the required reviewer on the `production` GitHub environment. Nothing
 * in this repository points a local command at the live Worker.
 *
 * A script rather than a bare `wrangler deploy` in package.json, for two
 * checks a plain command cannot make: it refuses `--env`, and it reads back
 * the name the build produced before uploading anything.
 */

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const GENERATED = "dist/server/wrangler.json";
const STAGING = "emptystates-v2";

// Someone reaching for the old flag is at exactly the moment the instructions
// are useful.
if (process.argv.includes("--production")) {
  console.error(
    `Production is deployed by CI, not from here. Tag the commit:\n\n` +
      `  git tag v2.0.0\n` +
      `  git push origin v2.0.0\n\n` +
      `That uploads a version and stops. Approve the promote job at\n` +
      `https://github.com/craigmdennis/emptystates/actions to move traffic.`,
  );
  process.exit(1);
}

// `--env` reads as though it selects a target. Wrangler accepts an unknown
// environment without complaint, applies nothing, and deploys whatever the
// generated config's `name` says. That is how the live site was replaced on
// 2026-08-23. Refusing the flag stops it being trusted again.
const envFlag = process.argv.find((a) => a === "--env" || a.startsWith("--env="));
if (envFlag) {
  console.error(
    `Refusing \`${envFlag}\`. The Astro adapter drops the env block from the\n` +
      `generated config, so wrangler applies nothing and falls back to the\n` +
      `top-level name. \`npm run deploy\` already targets staging.`,
  );
  process.exit(1);
}

const config = JSON.parse(readFileSync(GENERATED, "utf8")) as { name?: string };

// A generated config naming anything else means `wrangler.jsonc` was edited,
// and this script's whole guarantee rests on that file being the safe one.
if (config.name !== STAGING) {
  console.error(
    `${GENERATED} names "${config.name}". Expected "${STAGING}".\n` +
      `Check wrangler.jsonc's top-level name, then run \`npm run build\` again.`,
  );
  process.exit(1);
}

console.log(`\nDeploying to Worker: ${config.name}\n`);

const result = spawnSync("npx", ["wrangler", "deploy"], { stdio: "inherit" });
process.exit(result.status ?? 1);
