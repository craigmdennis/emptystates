import { it, expect } from "vitest";
import { VARIANT_WIDTHS, variantKey, variantsFor } from "../src/lib/variants";

it("offers the three widths the display paths ask for", () => {
  expect(VARIANT_WIDTHS).toEqual([640, 1280, 2560]);
});

it("writes every variant an original is wide enough for", () => {
  expect(variantsFor(2560)).toEqual([640, 1280, 2560]);
  expect(variantsFor(1280)).toEqual([640, 1280]);
});

// Upscaling spends bytes to add no detail, and a 900px original enlarged to
// 1280 looks worse than the browser scaling the 640 up.
it("never upscales past the original's width", () => {
  expect(variantsFor(900)).toEqual([640]);
  expect(variantsFor(3024)).toEqual([640, 1280, 2560]);
});

it("includes a width the original matches exactly", () => {
  expect(variantsFor(640)).toEqual([640]);
});

// tumblr_mh8v21c0YA1rdf37to1_400 is 400 wide. srcset falls back to the largest
// variant that exists, so an entry with none is served its original.
it("returns nothing for an original narrower than every variant", () => {
  expect(variantsFor(400)).toEqual([]);
});

it("keys a variant by state id under its width prefix", () => {
  expect(variantKey(640, "01KZS8VW5PEMBKWRJCVM2K5A61")).toBe(
    "w640/01KZS8VW5PEMBKWRJCVM2K5A61.webp",
  );
});
