import { it, expect } from "vitest";
import { slugify, dedupeSlug, isCleanSlug } from "../src/lib/slug";

it("slugifies title and app name", () => {
  expect(slugify("No results", "Feedly")).toBe("no-results-in-feedly");
});

it("does not repeat an app name the title already carries", () => {
  expect(slugify("No services in Tower 2 for Mac", "Tower")).toBe(
    "no-services-in-tower-2-for-mac",
  );
  expect(slugify("No content in Plex", "Plex")).toBe("no-content-in-plex");
});

it("omits the connector when there is no app name", () => {
  expect(slugify("No results", "")).toBe("no-results");
  expect(slugify("No results", null)).toBe("no-results");
});

it("strips punctuation and collapses whitespace", () => {
  expect(slugify("You're all done!", "Sunrise")).toBe("youre-all-done-in-sunrise");
  expect(slugify("You’re all done!", "Sunrise")).toBe("youre-all-done-in-sunrise");
  expect(slugify("Nothing   here", "Slack")).toBe("nothing-here-in-slack");
});

it("appends a numeric suffix on collision", () => {
  const taken = new Set(["no-results-in-feedly"]);
  expect(dedupeSlug("no-results-in-feedly", taken)).toBe("no-results-in-feedly-2");
});

it("keeps counting past the first collision", () => {
  const taken = new Set(["a", "a-2", "a-3"]);
  expect(dedupeSlug("a", taken)).toBe("a-4");
});

// The legacy directory names ARE the live URLs. Preferring them over a freshly
// generated slug is the only thing keeping 235 existing links alive, so the
// check that decides whether a directory name is reusable is tested directly.
it("accepts a legacy directory name that is already a clean slug", () => {
  expect(isCleanSlug("all-posts-read-in-feedly-for-android")).toBe(true);
  expect(isCleanSlug("no-results")).toBe(true);
});

it("rejects names that would not survive as a URL segment", () => {
  expect(isCleanSlug("tumblr_n60wmfQ5b41rdf37to1_1280")).toBe(false);
  expect(isCleanSlug("Has Capitals")).toBe(false);
  expect(isCleanSlug("-leading-hyphen")).toBe(false);
  expect(isCleanSlug("trailing-hyphen-")).toBe(false);
  expect(isCleanSlug("double--hyphen")).toBe(false);
  expect(isCleanSlug("")).toBe(false);
});
