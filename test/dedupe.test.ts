import { it, expect } from "vitest";
import { resolveCandidates, type Candidate } from "../src/migrate/dedupe";

const dir = (slug: string, over: Partial<Candidate> = {}): Candidate => ({
  slug,
  form: "directory",
  markdownPath: `content/states/${slug}/index.md`,
  imagePath: `content/states/${slug}/shot.png`,
  imageHash: "aaa",
  ...over,
});

const flat = (slug: string, over: Partial<Candidate> = {}): Candidate => ({
  slug,
  form: "flat",
  markdownPath: `content/states/${slug}.md`,
  imagePath: `content/states/shot.png`,
  imageHash: "aaa",
  ...over,
});

it("prefers the directory form and skips its flat twin", () => {
  const r = resolveCandidates([flat("no-results"), dir("no-results")]);
  expect(r.keep).toHaveLength(1);
  expect(r.keep[0].form).toBe("directory");
  expect(r.skipped).toEqual([
    {
      path: "content/states/no-results.md",
      slug: "no-results",
      reason: "duplicate-of-directory",
    },
  ]);
});

it("keeps a flat entry that has no directory twin", () => {
  const r = resolveCandidates([flat("only-flat")]);
  expect(r.keep).toHaveLength(1);
  expect(r.keep[0].form).toBe("flat");
  expect(r.skipped).toHaveLength(0);
});

// The whole reason the plan says "compare image bytes before discarding":
// discarding is only safe when the two copies actually agree.
it("reports a conflict when the two copies hold different images", () => {
  const r = resolveCandidates([
    flat("no-results", { imageHash: "bbb" }),
    dir("no-results", { imageHash: "aaa" }),
  ]);
  expect(r.conflicts).toEqual([
    { slug: "no-results", directoryHash: "aaa", flatHash: "bbb" },
  ]);
  // Still resolved rather than dropped — the directory wins, loudly.
  expect(r.keep).toHaveLength(1);
  expect(r.keep[0].form).toBe("directory");
});

it("raises no conflict when the copies are byte-identical", () => {
  const r = resolveCandidates([flat("no-results"), dir("no-results")]);
  expect(r.conflicts).toHaveLength(0);
});

it("treats a directory with an image but no markdown as an orphan", () => {
  const r = resolveCandidates([dir("tumblr_n60wmf", { markdownPath: null })]);
  expect(r.orphans).toEqual(["tumblr_n60wmf"]);
  // Kept, because orphans are imported as drafts rather than discarded.
  expect(r.keep).toHaveLength(1);
});

it("drops a candidate with neither markdown nor image", () => {
  const r = resolveCandidates([
    dir("empty-dir", { markdownPath: null, imagePath: null, imageHash: null }),
  ]);
  expect(r.keep).toHaveLength(0);
  expect(r.orphans).toHaveLength(0);
  expect(r.empty).toEqual(["empty-dir"]);
});

it("returns kept entries in stable slug order", () => {
  const r = resolveCandidates([dir("charlie"), dir("alpha"), dir("bravo")]);
  expect(r.keep.map((c) => c.slug)).toEqual(["alpha", "bravo", "charlie"]);
});
