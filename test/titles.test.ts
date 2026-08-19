import { it, expect } from "vitest";
import { isPlaceholderTitle } from "../src/lib/titles";

// 153 of the 235 published titles are the Tumblr filename the image arrived
// with. The design treats those differently in three places — the grid caption
// truncates them from the head, the detail heading sets them in mono, and a
// note says why — so the test has to be one function, not three regexes.
it("recognises a Tumblr filename left as a title", () => {
  expect(isPlaceholderTitle("tumblr_mgbxptW6cA1rdf37to1_1280")).toBe(true);
});

it("leaves a written title alone", () => {
  expect(isPlaceholderTitle("No conversations yet in Monzo for Android")).toBe(
    false,
  );
});

// The rule is filename-shaped, not tumblr-shaped: submissions will arrive with
// their own uploads and the same problem.
it("recognises any single-word filename stem", () => {
  expect(isPlaceholderTitle("Screen_Shot_2019-04-02_at_10.51.13")).toBe(true);
});

it("does not call a one-word title a filename", () => {
  expect(isPlaceholderTitle("Inbox")).toBe(false);
});
