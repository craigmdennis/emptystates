/**
 * Serves an R2 object, for development only.
 *
 * Every deployed image URL resolves to `img.emptystat.es`, the bucket's own
 * custom domain, so images never invoke the Worker. `mediaBase()` returns that
 * host for any build, staging included.
 *
 * `astro dev` runs on Vite with no bucket to read, so `PUBLIC_MEDIA_BASE=/img`
 * in `.env` points each image here and this route reads it through the `MEDIA`
 * binding. Nothing links here from a build.
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
