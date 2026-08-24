import { it, expect } from "vitest";
import { deriveDevice } from "../src/lib/device";

// Mirrors migrations/0001: overlapping ranges, first match by sort_order wins.
const DEVICES = [
  { slug: "phone", min_ratio: 0.4, max_ratio: 0.65, sort_order: 1, is_active: 1 },
  { slug: "tablet", min_ratio: 0.65, max_ratio: 1.5, sort_order: 2, is_active: 1 },
  { slug: "desktop", min_ratio: 1.2, max_ratio: 2.2, sort_order: 3, is_active: 1 },
  { slug: "tv", min_ratio: 1.5, max_ratio: 2.4, sort_order: 4, is_active: 1 },
  { slug: "console", min_ratio: 1.5, max_ratio: 2.4, sort_order: 5, is_active: 0 },
  { slug: "watch", min_ratio: 0.7, max_ratio: 1.3, sort_order: 6, is_active: 1 },
];

it("derives phone from an iPhone screenshot ratio", () => {
  expect(deriveDevice(1170 / 2532, DEVICES)).toBe("phone");
});

it("takes the first active range by sort_order when ranges overlap", () => {
  expect(deriveDevice(1.4, DEVICES)).toBe("tablet"); // tablet before desktop
  expect(deriveDevice(1.6, DEVICES)).toBe("desktop"); // desktop before tv
});

it("skips inactive device types", () => {
  const only = DEVICES.filter((d) => d.slug === "console" || d.slug === "tv");
  expect(deriveDevice(1.6, only)).toBe("tv");
});

it("returns null when nothing contains the ratio", () => {
  expect(deriveDevice(5.0, DEVICES)).toBeNull();
  expect(deriveDevice(0.2, DEVICES)).toBeNull();
});

it("returns null for a device whose range is unset", () => {
  expect(deriveDevice(0.5, [{ slug: "x", min_ratio: null, max_ratio: null, sort_order: 1, is_active: 1 }])).toBeNull();
});
