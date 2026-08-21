import { classifyTag, preferOs } from "../src/migrate/classify";
import { it, expect } from "vitest";

// Every case below is a real value from content/states/.

it("maps device terms, including the 'mobil' typo", () => {
  expect(classifyTag("mobile", "x")).toEqual({ kind: "device", value: "phone" });
  expect(classifyTag("mobil", "x")).toEqual({ kind: "device", value: "phone" });
  expect(classifyTag("desktop", "x")).toEqual({ kind: "device", value: "desktop" });
});

it("maps OS terms and normalises case", () => {
  expect(classifyTag("ios", "x")).toEqual({ kind: "os", value: "ios" });
  expect(classifyTag("macOS", "x")).toEqual({ kind: "os", value: "macos" });
  expect(classifyTag("macos", "x")).toEqual({ kind: "os", value: "macos" });
  expect(classifyTag("windows", "x")).toEqual({ kind: "os", value: "windows" });
});

it("maps browser variants and the 'browswer' typo to web", () => {
  expect(classifyTag("browser", "x")).toEqual({ kind: "os", value: "web" });
  expect(classifyTag("browswer", "x")).toEqual({ kind: "os", value: "web" });
  expect(classifyTag("web", "x")).toEqual({ kind: "os", value: "web" });
  expect(classifyTag("progressive web app", "x")).toEqual({ kind: "os", value: "web" });
});

it("maps Android skins and device models to the OS, not the model", () => {
  expect(classifyTag("oxygen os", "x")).toEqual({ kind: "os", value: "android" });
  expect(classifyTag("samsung", "x")).toEqual({ kind: "os", value: "android" });
  expect(classifyTag("pixel 2 xl", "x")).toEqual({ kind: "os", value: "android" });
});

it("prefers OS over device when a term is both", () => {
  // 'android' implies a phone, but device is recoverable from aspect ratio
  // and OS is not, so the more specific fact wins.
  expect(classifyTag("android", "x")).toEqual({ kind: "os", value: "android" });
});

it("keeps genuine semantic tags, hyphenating multi-word ones", () => {
  expect(classifyTag("onboarding", "x")).toEqual({ kind: "tag", value: "onboarding" });
  expect(classifyTag("permissions", "x")).toEqual({ kind: "tag", value: "permissions" });
  expect(classifyTag("first run", "x")).toEqual({ kind: "tag", value: "first-run" });
  expect(classifyTag("inbox zero", "x")).toEqual({ kind: "tag", value: "inbox-zero" });
  expect(classifyTag("user cleared", "x")).toEqual({ kind: "tag", value: "user-cleared" });
});

it("repairs the 'emai' typo", () => {
  expect(classifyTag("emai", "x")).toEqual({ kind: "tag", value: "email" });
});

it("drops empty and whitespace-only tags", () => {
  expect(classifyTag("", "x")).toEqual({ kind: "drop", reason: "empty" });
  expect(classifyTag("   ", "x")).toEqual({ kind: "drop", reason: "empty" });
});

it("drops a tag that is the entry's own title", () => {
  const t = "No downloads in Bitbucket";
  expect(classifyTag(t, t)).toEqual({ kind: "drop", reason: "is-title" });
});

it("drops title-shaped tags even on a different entry", () => {
  // Every real tag in the corpus is lowercase; every stray title starts with a
  // capital and runs to three or more words. That is the separating signal.
  expect(classifyTag("Nothing published in Figma Community", "other")).toEqual({
    kind: "drop",
    reason: "looks-like-title",
  });
  expect(classifyTag("No contacts to merge", "other")).toEqual({
    kind: "drop",
    reason: "looks-like-title",
  });
});

it("does not mistake lowercase multi-word tags for titles", () => {
  expect(classifyTag("progressive web app", "other").kind).not.toBe("drop");
  expect(classifyTag("pixel 2 xl", "other").kind).not.toBe("drop");
});

it("drops anything longer than 40 characters", () => {
  expect(classifyTag("a".repeat(41), "x")).toEqual({ kind: "drop", reason: "too-long" });
});

it("reports unknown short tags as unmapped rather than guessing", () => {
  expect(classifyTag("quantum", "x")).toEqual({ kind: "unmapped", raw: "quantum" });
});

// Issue #26. `os ??=` in the importer took whichever OS tag came first, so
// `desktop, browser, windows` imported as web and /tags/windows rendered empty.
it("prefers a named platform over the generic web", () => {
  expect(preferOs("web", "windows")).toBe("windows");
  expect(preferOs("windows", "web")).toBe("windows");
  expect(preferOs("web", "macos")).toBe("macos");
  expect(preferOs(null, "web")).toBe("web");
  expect(preferOs("web", null)).toBe("web");
});

// Two named platforms on one entry is a content question, not a mechanical
// one, so the first stands and the report lists the entry.
it("keeps the first of two named platforms", () => {
  expect(preferOs("android", "macos")).toBe("android");
  expect(preferOs("ios", "windows")).toBe("ios");
});

it("returns null when neither side names an OS", () => {
  expect(preferOs(null, null)).toBeNull();
});

// The `TAGS` map is the only route to `kind: "tag"`. A facet term added to it
// would produce a tag slug colliding with a device or an operating system,
// and one word would then name two query keys.
it("classifies every facet term as a facet", () => {
  const facets = [
    "mobile", "mobil", "phone", "tablet", "desktop", "tv", "console", "watch",
    "ios", "android", "web", "browser", "macos", "windows", "linux",
  ];
  const asTag = facets.filter((t) => classifyTag(t, "x").kind === "tag");
  expect(asTag, `classified as tags: ${asTag.join(", ")}`).toEqual([]);
});
