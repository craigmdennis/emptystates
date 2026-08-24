/**
 * POST one image, get a draft back. Both entry points call this: the picker
 * on /admin/new and the iOS Shortcut (docs/shortcut.md). Auth happens in the
 * middleware; by the time this runs the request carries a verified Access
 * identity.
 */

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { handleUpload, type ImagesLike } from "../../../lib/admin";

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Send multipart form data with a 'file' part" }, { status: 400 });
  }

  const e = env as unknown as { DB: D1Database; MEDIA: R2Bucket; IMAGES: ImagesLike };
  const result = await handleUpload({ db: e.DB, media: e.MEDIA, images: e.IMAGES }, file);
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ id: result.id, url: result.url });
};
