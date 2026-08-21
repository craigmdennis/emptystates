import { it, expect } from "vitest";
import legacy from "./fixtures/legacy-urls.json";
import { RETIRED } from "../src/db/redirects";
import { resolveTagPath } from "../src/lib/tags";
import { parsePageSegment } from "../src/lib/pagination";

/**
 * Every address the live Gatsby site publishes, as far as a pure function can
 * check it.
 *
 * Whether each of the 235 entry addresses resolves depends on the 235 rows the
 * migration wrote, and the Workers pool starts from an empty database. That
 * half is `scripts/check-legacy-urls.ts`, which reads the local D1.
 */

// The fixture and the set in `redirects.ts` name the same eight entries, and
// nothing keeps them together except this.
it("matches the retired set to the fixture", () => {
  expect([...RETIRED].sort()).toEqual(
    legacy.retiredWithPages.map((n) => `/s/${n}`).sort(),
  );
});

it("routes every tag page", () => {
  const dead = legacy.tags.filter((t) => resolveTagPath(t) === null);
  expect(dead, `unroutable tags: ${dead.join(", ")}`).toEqual([]);
});

// The gap this fixture missed until now: `/2` is a path, and `couldBeRedirect`
// rejects it, so nothing in the redirect layer would ever have claimed it.
it("parses every paginated address master publishes", () => {
  const dead = [...legacy.indexPages, ...legacy.tagPages].filter((path) => {
    const segment = path.split("/").pop();
    return parsePageSegment(segment) === null;
  });
  expect(dead, `unparseable page segments: ${dead.join(", ")}`).toEqual([]);
});

// Master's URLs all end in a slash and `trailingSlash` is 'never', so the
// slashed form redirects to the address these parse.
it("parses a paginated address carrying its trailing slash", () => {
  const segment = "/tags/mobile/2/".split("/").filter(Boolean).pop();
  expect(parsePageSegment(segment)).toBe(2);
});
