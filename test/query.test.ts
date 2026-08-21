import { it, expect } from "vitest";
import { readList, toggleParam, withParams } from "../src/lib/query";

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

// Tags are multi-select and ride in one comma-separated `tag` parameter. Each
// row in the popover is a link that adds or removes its own value. Google's
// ecommerce URL page states "Avoid using the same parameters twice. Googlebot
// may ignore one of the values otherwise."
it("adds a first tag as one parameter", () => {
  expect(toggleParam(url("/"), "tag", "error")).toBe("/?tag=error");
});

it("appends a second tag to the same parameter", () => {
  expect(toggleParam(url("/?tag=error"), "tag", "onboarding")).toBe(
    "/?tag=error,onboarding",
  );
});

it("removes only the tag it names", () => {
  expect(toggleParam(url("/?tag=error,onboarding"), "tag", "error")).toBe(
    "/?tag=onboarding",
  );
});

it("removes the parameter when the last tag goes", () => {
  expect(toggleParam(url("/?tag=error"), "tag", "error")).toBe("/");
});

// Narrowing from page 3 of a longer result set lands past the end of a
// shorter one, so a selection returns to the base path.
it("keeps the other filters while toggling a tag, and resets the page", () => {
  expect(toggleParam(url("/3?device=phone"), "tag", "first-run")).toBe(
    "/?device=phone&tag=first-run",
  );
});

it("reads the value back as a list", () => {
  expect(readList(url("/?tag=error,onboarding"), "tag")).toEqual([
    "error",
    "onboarding",
  ]);
  expect(readList(url("/"), "tag")).toEqual([]);
  expect(readList(url("/?tag="), "tag")).toEqual([]);
});

// `URLSearchParams.toString` percent-encodes the comma as `%2C`. A reader
// decodes both spellings the same way, so the difference reaches a search
// engine as two addresses and reaches the site as none.
it("carries a literal comma through withParams", () => {
  expect(withParams(url("/?tag=error,onboarding"), { open: "tag" })).toBe(
    "/?tag=error,onboarding&open=tag",
  );
});
