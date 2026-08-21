import { it, expect } from "vitest";
import { basePath, pageHref, parsePageSegment } from "../src/lib/pagination";

it("reads a page number from the segment", () => {
  expect(parsePageSegment("2")).toBe(2);
  expect(parsePageSegment("47")).toBe(47);
});

// `/` is page 1. `/1` would be a second address for it, so the route rejects
// the segment and redirects it.
it("rejects the segment that would duplicate page one", () => {
  expect(parsePageSegment("1")).toBeNull();
});

it("treats an absent segment as page one", () => {
  expect(parsePageSegment(undefined)).toBe(1);
  expect(parsePageSegment("")).toBe(1);
});

// A root rest route matches everything a more specific route did not claim.
it("rejects anything that is not a bare integer", () => {
  for (const segment of ["abc", "2x", "-3", "2.5", "02", " 2", "2/3", "١٢"]) {
    expect(parsePageSegment(segment), segment).toBeNull();
  }
});

it("builds page one as the bare base", () => {
  expect(pageHref("/", 1, "")).toBe("/");
  expect(pageHref("/tags/mobile", 1, "")).toBe("/tags/mobile");
});

it("builds later pages as a path segment", () => {
  expect(pageHref("/", 3, "")).toBe("/3");
  expect(pageHref("/tags/mobile", 3, "")).toBe("/tags/mobile/3");
});

it("carries the filters through as a query string", () => {
  expect(pageHref("/", 3, "device=phone")).toBe("/3?device=phone");
  expect(pageHref("/", 1, "device=phone")).toBe("/?device=phone");
});

// Choosing a filter has to return to page 1: narrowing from page 3 of a
// longer result set lands past the end of a shorter one, which is a 404.
it("reduces a paginated path to the address page one is served at", () => {
  expect(basePath("/3")).toBe("/");
  expect(basePath("/")).toBe("/");
  expect(basePath("/tags/mobile/3")).toBe("/tags/mobile");
  expect(basePath("/tags/mobile")).toBe("/tags/mobile");
});

it("leaves a path whose last segment is not a page number", () => {
  expect(basePath("/s/no-deals-yet")).toBe("/s/no-deals-yet");
});
