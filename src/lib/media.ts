/**
 * The single place an R2 key becomes a URL.
 *
 * Every deployed page serves images straight from the bucket over
 * `img.emptystat.es`, so they never invoke the Worker. `astro dev` has no
 * bucket to read, so `PUBLIC_MEDIA_BASE=/img` points each image at the Worker
 * route, which reads the same objects through the `MEDIA` binding.
 *
 * One function, so the development server and a build differ here instead of
 * in every template.
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

/**
 * The production host, unless this is the development server.
 *
 * `PUBLIC_MEDIA_BASE` is a development convenience: `astro dev` serves from
 * Vite with no public bucket to read, so `/img` routes each request through
 * `src/pages/img/[...key].ts` and the `MEDIA` binding.
 *
 * A build ignores it. Astro inlines `PUBLIC_*` from `.env` at build time, and
 * a machine with `PUBLIC_MEDIA_BASE=/img` in that file would otherwise ship a
 * Worker serving all 235 images per page itself, which is the one thing
 * putting them in R2 was for. `import.meta.env.DEV` separates the two: true
 * under `astro dev`, false in every build.
 */
export function mediaBase(): string {
  if (!import.meta.env?.DEV) return DEFAULT_BASE;
  return resolveBase(import.meta.env.PUBLIC_MEDIA_BASE);
}

export function mediaUrl(key: string, base: string = mediaBase()): string {
  return `${base.replace(/\/+$/, "")}/${key.replace(/^\/+/, "")}`;
}
