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
 * The controls that followed are split in two. A laptop reaches staging and
 * nothing else. Production is reached by `.github/workflows/production.yml`,
 * from a tag, behind the required reviewer on the `production` GitHub
 * environment. Everything below reads file text out of `TEST_SOURCES`, since
 * workerd has no filesystem.
 */
const sources = env.TEST_SOURCES;

const STAGING = "emptystates-v2";
const PRODUCTION = "emptystates";

function read(path: string): string {
  const text = sources[path] ?? "";
  expect(text, `${path} is missing from TEST_SOURCES`).not.toBe("");
  return text;
}

/** Comment lines. Both file formats carry prose that discusses both names. */
const isComment = (line: string) => /^\s*(\/\/|#)/.test(line);

const configLines = () =>
  read("wrangler.jsonc")
    .split("\n")
    .filter((line) => !isComment(line));

const workflows = Object.entries(sources).filter(([path]) =>
  path.startsWith(".github/workflows/"),
);

const packageScripts = () => {
  const pkg = JSON.parse(read("package.json")) as {
    scripts?: Record<string, string>;
  };
  return Object.entries(pkg.scripts ?? {});
};

// ---------------------------------------------------------------- the config

// The safe name on top means the worst case of a wrong flag is a staging
// deploy. `scripts/deploy.ts` reads this name back and refuses to run when it
// says anything else.
it("names the staging Worker at the top level", () => {
  const nameLine = configLines().find((line) => /"name"\s*:/.test(line));
  expect(nameLine?.trim()).toBe(`"name": "${STAGING}",`);
});

// An `env` block reads as though `--env` works here. It does not: the adapter
// drops it, and the flag then applies nothing.
it("declares no environments, which a build would discard", () => {
  const offenders = configLines().filter((line) => /"env"\s*:/.test(line));
  expect(
    offenders,
    `wrangler.jsonc declares an env block: ${offenders.join(", ")}`,
  ).toEqual([]);
});

// ----------------------------------------------------------------- the local

it("routes every local deploy through scripts/deploy.ts", () => {
  const raw = packageScripts()
    .filter(([, cmd]) => /wrangler\s+deploy/.test(cmd))
    .map(([name]) => name);

  expect(raw, `these call wrangler deploy directly: ${raw.join(", ")}`).toEqual(
    [],
  );
});

// The production path left this machine with #44. A script that puts it back
// is the regression this catches.
it("offers a staging deploy and no production deploy", () => {
  const scripts = packageScripts();
  expect(Object.fromEntries(scripts).deploy).toContain("scripts/deploy.ts");

  const reaching = scripts
    .filter(([name, cmd]) => /production|--env/.test(`${name} ${cmd}`))
    .map(([name]) => name);

  expect(
    reaching,
    `these can target production from a laptop: ${reaching.join(", ")}`,
  ).toEqual([]);
});

// The live Worker's name is not a value anything local can pass to wrangler.
// Prose about it is fine; a quoted token is the thing that gets used.
it("keeps the live Worker's name out of the deploy script", () => {
  const offenders = read("scripts/deploy.ts")
    .split("\n")
    .map((line, i) => [line, i + 1] as const)
    .filter(([line]) => !isComment(line))
    .filter(([line]) => new RegExp(`["'\`]${PRODUCTION}["'\`]`).test(line))
    .map(([, n]) => `scripts/deploy.ts:${n}`);

  expect(offenders).toEqual([]);
});

// -------------------------------------------------------------------- the CI

/**
 * Job blocks, keyed by name. Job keys sit at two spaces under `jobs:` and
 * everything inside a job is indented further, so the split needs no YAML
 * parser.
 */
function jobs(yaml: string): [string, string][] {
  const start = yaml.indexOf("\njobs:\n");
  expect(start, "workflow declares no jobs").toBeGreaterThan(-1);

  const body = yaml.slice(start);
  const key = /\n {2}([A-Za-z0-9_-]+):\n/g;
  const out: [string, string][] = [];
  let previous: [string, number] | null = null;

  for (let m = key.exec(body); m; m = key.exec(body)) {
    if (previous) out.push([previous[0], body.slice(previous[1], m.index)]);
    previous = [m[1], m.index];
  }
  if (previous) out.push([previous[0], body.slice(previous[1])]);
  return out;
}

/** Commands that put traffic on a Worker. Uploading a version does not. */
const MOVES_TRAFFIC = /wrangler\s+deploy|versions\s+deploy|npm run deploy/;

// The typed confirmation is gone, and this is what replaced it: a job that
// moves traffic runs only after the `production` environment's reviewer
// approves. `production-preview`, which uploads a version and moves nothing,
// deliberately fails this pattern and is not required to pass it.
it("gates every CI job that can move production traffic", () => {
  const offenders: string[] = [];

  for (const [path, body] of workflows) {
    // staging.yml publishes the staging Worker. The test below covers it.
    if (path.endsWith("/staging.yml")) continue;

    for (const [name, text] of jobs(body)) {
      if (!MOVES_TRAFFIC.test(text)) continue;
      if (!/environment:\s*\n\s*name: production\n/.test(text)) {
        offenders.push(`${path}:${name}`);
      }
    }
  }

  expect(
    offenders,
    `these move traffic without the production gate: ${offenders.join(", ")}`,
  ).toEqual([]);
});

// A branch push must not be able to reach the live Worker at all. The tag-only
// trigger is one half; the environment's tag branch policy is the other, and
// that half lives in the repository settings rather than here.
it("triggers the production workflow from a tag alone", () => {
  const yaml = read(".github/workflows/production.yml");
  const triggers = yaml.slice(0, yaml.indexOf("\njobs:"));

  expect(triggers).toMatch(/tags:/);
  expect(triggers, "a branch push can start the production workflow").not.toMatch(
    /branches:/,
  );
});

// Whatever else the staging workflow grows, it cannot name another Worker.
it("leaves the staging workflow unable to name another Worker", () => {
  const yaml = read(".github/workflows/staging.yml");

  expect(yaml, "--name lets this workflow pick its own target").not.toMatch(
    /--name/,
  );
  expect(yaml).not.toMatch(/versions\s+deploy/);
  expect(yaml).not.toMatch(new RegExp(`\\b${PRODUCTION}\\b(?!-)`));
});
