/**
 * The only way this project is deployed.
 *
 *   npm run deploy                 # staging: emptystates-v2.craig-8d2.workers.dev
 *   npm run deploy:production      # emptystat.es, after typed confirmation
 *
 * Why a script rather than `wrangler deploy --env production`: the Astro
 * adapter flattens `wrangler.jsonc` into `dist/server/wrangler.json` at build
 * time and drops the `env` block, keeping only `definedEnvironments`. So
 * `--env <name>` validates against that list, finds no environment to apply,
 * and silently falls through to the top-level `name`. On 2026-08-23 that
 * published the rebuild over the live Gatsby site.
 *
 * The generated config's `name` is the field wrangler reads, so this patches
 * that field and prints it before uploading. The target is stated, not
 * inferred.
 */

import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { readFileSync, writeFileSync } from "node:fs";
import { stdin, stdout } from "node:process";

const GENERATED = "dist/server/wrangler.json";
const STAGING = "emptystates-v2";
const PRODUCTION = "emptystates";

const production = process.argv.includes("--production");

// `--env` reads as though it selects a target here. Wrangler accepts an
// unknown environment without complaint, applies nothing, and deploys
// whatever the generated config's `name` says. That is how the live site was
// replaced. Refusing the flag stops it being trusted again.
const envFlag = process.argv.find((a) => a === "--env" || a.startsWith("--env="));
if (envFlag) {
  console.error(
    `Refusing \`${envFlag}\`. The Astro adapter drops the env block from the\n` +
      `generated config, so wrangler applies nothing and falls back to the\n` +
      `top-level name. Use \`npm run deploy\` for staging, or\n` +
      `\`npm run deploy:production\` for emptystat.es.`,
  );
  process.exit(1);
}

const config = JSON.parse(readFileSync(GENERATED, "utf8")) as {
  name?: string;
  topLevelName?: string;
};

// The build must have produced the staging name. A generated config already
// naming production means `wrangler.jsonc` was edited back, and this script's
// whole guarantee rests on that file being the safe one.
if (config.name !== STAGING) {
  console.error(
    `${GENERATED} names "${config.name}". Expected "${STAGING}".\n` +
      `Check wrangler.jsonc's top-level name, then run \`npm run build\` again.`,
  );
  process.exit(1);
}

if (production) {
  console.log(
    `\nThis replaces the live site at https://emptystat.es\n` +
      `Worker: ${PRODUCTION}\n` +
      `Roll back with: npx wrangler rollback --name ${PRODUCTION}\n`,
  );
  if (!stdin.isTTY) {
    console.error("Refusing to deploy production without a terminal to confirm at.");
    process.exit(1);
  }
  const rl = createInterface({ input: stdin, output: stdout });
  const answer = await rl.question(`Type "${PRODUCTION}" to continue: `);
  rl.close();
  if (answer.trim() !== PRODUCTION) {
    console.error("Not confirmed. Nothing was deployed.");
    process.exit(1);
  }
  config.name = PRODUCTION;
  config.topLevelName = PRODUCTION;
  writeFileSync(GENERATED, JSON.stringify(config));
}

console.log(`\nDeploying to Worker: ${config.name}\n`);

const result = spawnSync("npx", ["wrangler", "deploy"], { stdio: "inherit" });

// The patch lives in a build artifact, and leaving production's name there
// would make the next `npm run deploy` publish production.
if (production) {
  config.name = STAGING;
  config.topLevelName = STAGING;
  writeFileSync(GENERATED, JSON.stringify(config));
  console.log(`\n${GENERATED} restored to "${STAGING}".`);
}

process.exit(result.status ?? 1);
