import { it, expect } from "vitest";
import { toggleParam, withParams } from "../src/lib/query";

const url = (s: string) => new URL(s, "https://emptystat.es");

// Every filter control in the toolbar is a link, so the whole facet UI is one
// function that rewrites the current query string.
it("sets a filter on top of the current query", () => {
  expect(withParams(url("/?os=ios"), { device: "phone" })).toBe(
    "/?os=ios&device=phone",
  );
});

it("removes a filter set to null, which is what Any and Clear do", () => {
  expect(withParams(url("/?os=ios&device=phone"), { os: null })).toBe(
    "/?device=phone",
  );
});

it("drops the question mark when nothing is left", () => {
  expect(withParams(url("/?device=phone"), { device: null })).toBe("/");
});

// Changing a filter while on page 3 would otherwise land past the end of a
// shorter result set. Callers pass page explicitly — pagination sets it, the
// facets clear it — so one function serves both.
it("keeps the path it was given", () => {
  expect(withParams(url("/tags/mobile?page=2"), { page: 3 })).toBe(
    "/tags/mobile?page=3",
  );
});

// Tags are multi-select, so they arrive as repeated `tag` parameters and each
// row in the popover is a link that adds or removes its own.
it("adds a tag alongside the ones already chosen", () => {
  expect(toggleParam(url("/?tag=first-run"), "tag", "inbox-zero")).toBe(
    "/?tag=first-run&tag=inbox-zero",
  );
});

it("removes only the tag it names", () => {
  expect(
    toggleParam(url("/?tag=first-run&tag=inbox-zero"), "tag", "first-run"),
  ).toBe("/?tag=inbox-zero");
});

it("keeps the other filters while toggling a tag, and resets the page", () => {
  expect(toggleParam(url("/?device=phone&page=3"), "tag", "first-run")).toBe(
    "/?device=phone&tag=first-run",
  );
});
