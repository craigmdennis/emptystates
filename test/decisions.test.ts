import { it, expect } from "vitest";
import { setDeviceInFrontmatter } from "../src/migrate/decisions";

const FILE = `---
title: No content in Plex
date: 2020-09-27T21:43:17.516Z
image: ./shot.png
tags:
  - mobile
  - android
---

Designed by someone.
`;

it("adds a device line to frontmatter, leaving everything else byte-identical", () => {
  const out = setDeviceInFrontmatter(FILE, "tablet");
  expect(out).toContain("device: tablet");
  // Every original line survives, in order: a rewrite through a YAML
  // serialiser would reflow dates and quoting across all 254 files.
  for (const line of FILE.split("\n")) {
    expect(out).toContain(line);
  }
});

it("replaces an existing device line instead of adding a second", () => {
  const once = setDeviceInFrontmatter(FILE, "tablet");
  const twice = setDeviceInFrontmatter(once, "desktop");
  expect(twice).toContain("device: desktop");
  expect(twice).not.toContain("device: tablet");
  expect(twice.match(/^device:/gm)).toHaveLength(1);
});

it("puts the device inside the frontmatter block, not the body", () => {
  const out = setDeviceInFrontmatter(FILE, "watch");
  const end = out.indexOf("---", 3);
  expect(out.indexOf("device: watch")).toBeLessThan(end);
});

it("refuses a file with no frontmatter rather than inventing a block", () => {
  expect(() => setDeviceInFrontmatter("Just a body.\n", "phone")).toThrow(
    /frontmatter/i,
  );
});
