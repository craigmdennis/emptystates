import { it, expect } from "vitest";
import { imageSources } from "../src/lib/images";

const BASE = "/img";

const state = (width: number) => ({
  id: "01KZS8VW5PEMBKWRJCVM2K5A61",
  r2_key: "originals/01KZS8VW5PEMBKWRJCVM2K5A61.png",
  width,
});

it("offers every variant an original earned, narrowest first", () => {
  const { srcset } = imageSources(state(3024), BASE);
  expect(srcset).toBe(
    "/img/w640/01KZS8VW5PEMBKWRJCVM2K5A61.webp 640w, " +
      "/img/w1280/01KZS8VW5PEMBKWRJCVM2K5A61.webp 1280w, " +
      "/img/w2560/01KZS8VW5PEMBKWRJCVM2K5A61.webp 2560w",
  );
});

it("defaults src to the narrowest variant", () => {
  expect(imageSources(state(3024), BASE).src).toBe(
    "/img/w640/01KZS8VW5PEMBKWRJCVM2K5A61.webp",
  );
});

// 206 of 235 states are under 1280 wide. Naming w1280 for all of them is 206
// requests for objects that were never written.
it("omits a variant wider than the original", () => {
  const { srcset } = imageSources(state(900), BASE);
  expect(srcset).toBe("/img/w640/01KZS8VW5PEMBKWRJCVM2K5A61.webp 640w");
});

// 8 states are narrower than 640 and have no variant at all.
it("falls back to the original when no variant exists", () => {
  const { src, srcset } = imageSources(state(400), BASE);
  expect(src).toBe("/img/originals/01KZS8VW5PEMBKWRJCVM2K5A61.png");
  expect(srcset).toBe("");
});

// The default base comes from PUBLIC_MEDIA_BASE, so asserting on it here would
// test whether this machine has a .env. `resolveBase` in media.test.ts covers
// the fallback.
it("keys every candidate off the state id, never the slug", () => {
  const { src, srcset } = imageSources(state(1280), BASE);
  expect(src).toContain("01KZS8VW5PEMBKWRJCVM2K5A61");
  expect(srcset.split(", ")).toEqual([
    "/img/w640/01KZS8VW5PEMBKWRJCVM2K5A61.webp 640w",
    "/img/w1280/01KZS8VW5PEMBKWRJCVM2K5A61.webp 1280w",
  ]);
});
