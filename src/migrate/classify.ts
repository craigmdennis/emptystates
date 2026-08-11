/**
 * Classifies one entry from a legacy `tags` array.
 *
 * The legacy field conflates three dimensions — device, OS and genuine semantic
 * tags — and additionally contains junk: entry titles that landed in the array
 * during a previous migration, empty strings, and case-variant duplicates.
 *
 * Pure by design. All I/O lives in the importer, so the decisions that would
 * silently corrupt 229 rows are exhaustively testable here.
 */

export type TagVerdict =
  | { kind: "device"; value: string }
  | { kind: "os"; value: string }
  | { kind: "tag"; value: string }
  | { kind: "drop"; reason: "empty" | "too-long" | "is-title" | "looks-like-title" }
  | { kind: "unmapped"; raw: string };

const DEVICE: Record<string, string> = {
  mobile: "phone",
  mobil: "phone", // typo in the corpus
  phone: "phone",
  iphone: "phone",
  "pixel 2 xl": "phone",
  tablet: "tablet",
  ipad: "tablet",
  desktop: "desktop",
  laptop: "desktop",
  tv: "tv",
  console: "console",
  watch: "watch",
};

const OS: Record<string, string> = {
  ios: "ios",
  iphone: "ios",
  ipad: "ios",
  android: "android",
  samsung: "android",
  "oxygen os": "android",
  "pixel 2 xl": "android",
  web: "web",
  browser: "web",
  browswer: "web", // typo in the corpus
  "progressive web app": "web",
  macos: "macos",
  osx: "macos",
  mac: "macos",
  windows: "windows",
  linux: "linux",
};

/** Canonical semantic tags, keyed by the raw form found in the corpus. */
const TAGS: Record<string, string> = {
  adobe: "adobe",
  ai: "ai",
  app: "app",
  automation: "automation",
  beta: "beta",
  calendar: "calendar",
  concept: "concept",
  connection: "connection",
  drafts: "drafts",
  ecommerce: "ecommerce",
  emai: "email", // typo in the corpus
  email: "email",
  error: "error",
  finance: "finance",
  "first run": "first-run",
  "first-run": "first-run",
  illustration: "illustration",
  "inbox zero": "inbox-zero",
  location: "location",
  marketing: "marketing",
  media: "media",
  "no-content": "no-content",
  "no-results": "no-results",
  onboarding: "onboarding",
  permissions: "permissions",
  plex: "plex",
  processing: "processing",
  productivity: "productivity",
  search: "search",
  slack: "slack",
  success: "success",
  "text-only": "text-only",
  upgrade: "upgrade",
  "user cleared": "user-cleared",
};

const MAX_LENGTH = 40;

/**
 * Every genuine tag in the corpus is lowercase; every stray entry title starts
 * with a capital and runs to three or more words. That is the separating
 * signal, and it is checked only after the known maps, so a legitimate
 * capitalised term would still be matched first.
 */
function looksLikeTitle(value: string): boolean {
  const firstChar = value[0] ?? "";
  const startsUpper = firstChar === firstChar.toUpperCase() && /[A-Z]/.test(firstChar);
  return startsUpper && value.split(/\s+/).length >= 3;
}

export function classifyTag(raw: string, entryTitle: string): TagVerdict {
  const trimmed = raw.trim();
  if (!trimmed) return { kind: "drop", reason: "empty" };
  if (trimmed.length > MAX_LENGTH) return { kind: "drop", reason: "too-long" };
  if (trimmed.toLowerCase() === entryTitle.trim().toLowerCase()) {
    return { kind: "drop", reason: "is-title" };
  }

  const key = trimmed.toLowerCase();

  // OS before device: 'android' and 'iphone' are both, and OS is the more
  // specific fact. Device is recoverable from aspect ratio; OS is not.
  if (OS[key]) return { kind: "os", value: OS[key] };
  if (DEVICE[key]) return { kind: "device", value: DEVICE[key] };
  if (TAGS[key]) return { kind: "tag", value: TAGS[key] };

  if (looksLikeTitle(trimmed)) return { kind: "drop", reason: "looks-like-title" };

  return { kind: "unmapped", raw: trimmed };
}
