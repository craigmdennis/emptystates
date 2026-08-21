import { it, expect } from "vitest";
import { canonicalPath } from "../src/lib/canonical";

const at = (href: string) => canonicalPath(new URL(href, "https://emptystat.es"));

it("keeps the parameter that names one indexable facet", () => {
  expect(at("/?device=phone")).toBe("/?device=phone");
  expect(at("/?os=ios")).toBe("/?os=ios");
});

// `view` is the layout and `open` reopens a popover. Neither changes the
// entries on the page, so both would put a second address in the index.
it("drops display state", () => {
  expect(at("/?view=square")).toBe("/");
  expect(at("/?open=tag")).toBe("/");
});

it("drops display state from an indexable facet view", () => {
  expect(at("/?device=phone&view=square")).toBe("/?device=phone");
  expect(at("/?os=ios&open=tag")).toBe("/?os=ios");
});

// Tags ride as one comma-separated value, so `tag` appears once. Google's
// ecommerce URL page states "Avoid using the same parameters twice. Googlebot
// may ignore one of the values otherwise."
it("orders tags inside the one parameter, which the toolbar appends in click order", () => {
  expect(at("/?tag=onboarding,error")).toBe("/");
  expect(at("/tags/mobile?tag=onboarding,error")).toBe("/tags/mobile");
});

it("drops a tag value stated twice", () => {
  expect(at("/?tag=error,error")).toBe("/");
});

// Three devices and five operating systems, each with enough entries to read
// as a page. 20 of the 25 tags carry one entry, so a tag view repeats a
// detail page and points at the gallery instead.
it("keeps one device or one operating system", () => {
  expect(at("/?device=phone")).toBe("/?device=phone");
  expect(at("/?os=ios")).toBe("/?os=ios");
  expect(at("/2?device=phone")).toBe("/2?device=phone");
});

it("sends a tag view to the gallery it filters", () => {
  expect(at("/?tag=onboarding")).toBe("/");
  expect(at("/3?tag=onboarding")).toBe("/3");
});

it("sends a combination of facets to the gallery", () => {
  expect(at("/?device=phone&os=ios")).toBe("/");
  expect(at("/?device=phone&tag=error")).toBe("/");
});

// Master published every URL with a trailing slash and `trailingSlash` is
// 'never', so the slashed form redirects. One of them is the canonical.
it("strips a trailing slash, keeping the root as a slash", () => {
  expect(at("/2/")).toBe("/2");
  expect(at("/tags/mobile/")).toBe("/tags/mobile");
  expect(at("/")).toBe("/");
});

it("ignores a parameter no facet uses", () => {
  expect(at("/?utm_source=twitter&fbclid=x")).toBe("/");
});

it("leaves a detail page alone", () => {
  expect(at("/s/no-deals-yet")).toBe("/s/no-deals-yet");
});
