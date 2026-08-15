import { it, expect } from "vitest";
import { normalizeRedirectPath } from "../src/lib/paths";

// Issue #27. Legacy `redirect` frontmatter was stored verbatim, and one of the
// 213 rows is an absolute URL. Lookups compare against url.pathname, which
// never carries a scheme or host, so that row could never match.
it("reduces an absolute legacy URL to its path", () => {
  expect(
    normalizeRedirectPath(
      "https://emptystates.tumblr.com/post/170905769614/no-conversations-yet-in-monzo-for-android",
    ),
  ).toBe("/post/170905769614/no-conversations-yet-in-monzo-for-android");
});

it("leaves a path alone", () => {
  expect(normalizeRedirectPath("/post/162316071385/no-stories")).toBe(
    "/post/162316071385/no-stories",
  );
});

it("drops a query string and a fragment, which no stored path carries", () => {
  expect(normalizeRedirectPath("https://x.tumblr.com/post/1?utm=a#b")).toBe(
    "/post/1",
  );
});

it("adds the leading slash a bare path is missing", () => {
  expect(normalizeRedirectPath("post/162316071385")).toBe("/post/162316071385");
});

it("returns null for nothing usable", () => {
  expect(normalizeRedirectPath(null)).toBeNull();
  expect(normalizeRedirectPath("")).toBeNull();
  expect(normalizeRedirectPath("   ")).toBeNull();
  // A bare host names no path worth storing.
  expect(normalizeRedirectPath("https://emptystates.tumblr.com/")).toBeNull();
});

it("strips a trailing slash so one path is stored one way", () => {
  expect(normalizeRedirectPath("/post/1/")).toBe("/post/1");
});
