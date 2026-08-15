/**
 * Serves an R2 object, for development only.
 *
 * Production points `PUBLIC_MEDIA_BASE` at nothing and every image URL resolves
 * to `img.emptystat.es`, the bucket's own custom domain, so images never invoke
 * the Worker — which the architecture requires. That domain has no local
 * equivalent, so `PUBLIC_MEDIA_BASE=/img` in `.dev.vars` routes the same
 * objects through the `MEDIA` binding instead.
 *
 * Nothing links here when the variable is unset.
 */

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const key = params.key;
  if (!key) return new Response("Not found", { status: 404 });

  const object = await env.MEDIA.get(key);
  if (!object) return new Response("Not found", { status: 404 });

  return new Response(object.body, {
    headers: {
      // The importer and scripts/build-variants.ts both set contentType when
      // they put. Falling back to a byte stream beats guessing from the key,
      // since this corpus holds .jpg files whose bytes are PNG.
      "Content-Type":
        object.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: object.httpEtag,
    },
  });
};
