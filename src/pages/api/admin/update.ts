/**
 * Save, unpublish, or publish an existing state. A plain form POST from the
 * edit screen, like publish; the `intent` field names which button was
 * pressed. 303 back to the edit screen after a save, and to the draft index
 * after a status change, each with a toast.
 */

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { handleUpdate, type UpdateIntent } from "../../../lib/admin";

const INTENTS = new Set<UpdateIntent>(["save", "unpublish", "publish"]);

export const POST: APIRoute = async ({ request, url }) => {
  const form = await request.formData().catch(() => null);
  if (!form) return new Response("Bad request", { status: 400 });

  const id = String(form.get("id") ?? "");
  const intent = String(form.get("intent") ?? "save") as UpdateIntent;
  if (!INTENTS.has(intent)) return new Response("Bad request", { status: 400 });

  const e = env as unknown as { DB: D1Database };
  const back = (q: Record<string, string>) =>
    Response.redirect(new URL(`/admin/edit/${id}?${new URLSearchParams(q)}`, url), 303);

  let result;
  try {
    result = await handleUpdate(e.DB, id, {
      title: String(form.get("title") ?? ""),
      appName: String(form.get("app_name") ?? ""),
      appUrl: String(form.get("app_url") ?? "") || undefined,
      deviceType: String(form.get("device_type") ?? ""),
      os: String(form.get("os") ?? ""),
      tagSlugs: form.getAll("tags").map(String),
    }, intent);
  } catch {
    return back({ error: "retry" });
  }
  if (!result.ok) return back({ error: result.error });
  if (intent === "save") return back({ saved: result.slug });

  const q = new URLSearchParams({ [intent === "publish" ? "published" : "unpublished"]: result.slug });
  return Response.redirect(new URL(`/admin?${q}`, url), 303);
};
