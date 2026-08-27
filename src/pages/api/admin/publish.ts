/**
 * Publish a draft. A plain form POST — the capture screen works without any
 * client JavaScript on this step. 303 so the browser lands back on the
 * capture screen with a GET: the next draft if one waits, else the picker.
 */

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { handlePublish, type ImagesLike } from "../../../lib/admin";

export const POST: APIRoute = async ({ request, url }) => {
  const form = await request.formData().catch(() => null);
  if (!form) return new Response("Bad request", { status: 400 });

  const draftId = String(form.get("draft") ?? "");
  const e = env as unknown as { DB: D1Database; MEDIA: R2Bucket; IMAGES: ImagesLike };

  let result;
  try {
    result = await handlePublish(
      { db: e.DB, media: e.MEDIA, images: e.IMAGES },
      draftId,
      {
        title: String(form.get("title") ?? ""),
        appName: String(form.get("app_name") ?? ""),
        appUrl: String(form.get("app_url") ?? "") || undefined,
        deviceType: String(form.get("device_type") ?? ""),
        os: String(form.get("os") ?? ""),
        tagSlugs: form.getAll("tags").map(String),
      },
    );
  } catch {
    // The draft is still pending; send the phone back to it to retry.
    const q = new URLSearchParams({ draft: draftId, error: "retry" });
    return Response.redirect(new URL(`/admin/new?${q}`, url), 303);
  }

  if (!result.ok) {
    const q = new URLSearchParams({ draft: draftId, error: result.error });
    return Response.redirect(new URL(`/admin/new?${q}`, url), 303);
  }
  // Always back to the capture screen: the toast there links to the post.
  const q = new URLSearchParams({ published: result.slug });
  if (result.nextDraft) q.set("draft", result.nextDraft);
  return Response.redirect(new URL(`/admin/new?${q}`, url), 303);
};
