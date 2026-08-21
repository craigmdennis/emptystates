import { it, expect } from "vitest";
import { env } from "cloudflare:test";

/**
 * The two rules the Astro 7 upgrade made worth holding.
 *
 * The Rust compiler collapses template whitespace by JSX rules, so a newline
 * between two elements no longer renders as a space. Anything separating two
 * pieces of text has to be a box — a flex item or a pseudo-element — rather
 * than a character sitting in a text run. Icons go through `Icon.astro`;
 * separators are drawn by `.dotted` and friends in `global.css`.
 *
 * These read the sources rather than the rendered pages: the point is to fail
 * on the template that reintroduces a glyph, naming the file, which a snapshot
 * of the output would not do.
 */
const sources = env.TEST_SOURCES;

const templates = Object.entries(sources).filter(([path]) =>
  path.endsWith(".astro"),
);

/** Comment lines, which are prose and may punctuate however they like. */
const isComment = (line: string) => /^\s*(\*|\/\/|\/\*)/.test(line);

/**
 * Characters that stand in for something the site should draw. The em dash is
 * absent deliberately: it punctuates sentences here, it is not furniture. So
 * are the curly quotes in `lib/slug.ts`, which strip real ones off legacy
 * titles and have to match the character to do it.
 */
const GLYPHS = /[\u00B7\u00D7\u2022\u2013\u2026\u2190\u2191\u2192\u2193\u2197\u2713]/;

it("draws icons through Icon.astro and nowhere else", () => {
  const offenders = templates
    .filter(([path]) => path !== "src/components/Icon.astro")
    .filter(([, body]) =>
      body.split("\n").some((line) => !isComment(line) && line.includes("<svg")),
    )
    .map(([path]) => path);

  expect(offenders).toEqual([]);
});

it("keeps glyph characters out of every template", () => {
  const offenders: string[] = [];

  for (const [path, body] of templates) {
    body.split("\n").forEach((line, i) => {
      if (isComment(line)) return;
      const hit = line.match(GLYPHS);
      if (hit) offenders.push(`${path}:${i + 1} ${JSON.stringify(hit[0])}`);
    });
  }

  expect(offenders).toEqual([]);
});

it("keeps glyph characters out of the stylesheet's content property", () => {
  const css = sources["src/styles/global.css"] ?? "";
  const drawn = [...css.matchAll(/content:\s*"([^"]*)"/g)].map((m) => m[1]);

  // Every separator is a shape with a width and a background, so the only
  // legal content value is the empty string that turns a pseudo-element on.
  expect(drawn.filter((value) => value !== "")).toEqual([]);
});
