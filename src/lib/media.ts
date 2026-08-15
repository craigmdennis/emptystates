/**
 * The single place an R2 key becomes a URL.
 *
 * Production serves images straight from the bucket over `img.emptystat.es`,
 * so they never invoke the Worker. That custom domain resolves in production
 * only, which leaves nothing for `wrangler dev` to load — set
 * `PUBLIC_MEDIA_BASE=/img` there and the Worker route reads the same objects
 * through the `MEDIA` binding.
 *
 * One function, so development and production differ by an environment
 * variable instead of by a conditional in every template.
 */

export const DEFAULT_BASE = "https://img.emptystat.es";

/**
 * Pure, so the fallback is testable without the ambient value deciding the
 * answer. A test of `mediaBase()` passes or fails on whether `.env` happens to
 * be set, which makes it a test of the machine.
 */
export function resolveBase(configured?: string | null): string {
  return configured || DEFAULT_BASE;
}

/** `PUBLIC_MEDIA_BASE`, or the production host when it is unset. */
export function mediaBase(): string {
  return resolveBase(import.meta.env?.PUBLIC_MEDIA_BASE);
}

export function mediaUrl(key: string, base: string = mediaBase()): string {
  return `${base.replace(/\/+$/, "")}/${key.replace(/^\/+/, "")}`;
}
