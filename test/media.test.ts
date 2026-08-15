import { it, expect } from "vitest";
import { DEFAULT_BASE, mediaUrl, resolveBase } from "../src/lib/media";

// resolveBase and not mediaBase: reading the ambient value would make this a
// test of whether .env happens to be set on this machine.
it("falls back to the production image host when nothing is configured", () => {
  expect(resolveBase(undefined)).toBe(DEFAULT_BASE);
  expect(resolveBase(null)).toBe(DEFAULT_BASE);
  expect(resolveBase("")).toBe(DEFAULT_BASE);
  expect(DEFAULT_BASE).toBe("https://img.emptystat.es");
});

it("prefers a configured base over the fallback", () => {
  expect(resolveBase("/img")).toBe("/img");
});

// PUBLIC_MEDIA_BASE=/img in development points every image at the Worker route
// that reads R2, since the R2 custom domain resolves in production only.
it("honours a configured base, including a relative one", () => {
  expect(mediaUrl("w640/abc.webp", "/img")).toBe("/img/w640/abc.webp");
  expect(mediaUrl("originals/abc.png", "https://cdn.example.test")).toBe(
    "https://cdn.example.test/originals/abc.png",
  );
});

it("does not double the separator when the base ends in a slash", () => {
  expect(mediaUrl("w640/abc.webp", "/img/")).toBe("/img/w640/abc.webp");
});

it("does not double the separator when the key starts with one", () => {
  expect(mediaUrl("/w640/abc.webp", "/img")).toBe("/img/w640/abc.webp");
});
