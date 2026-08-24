/**
 * Admin capture: upload and publish orchestration.
 *
 * Bindings arrive as parameters (the `src/db` convention), so the whole flow
 * runs under vitest with a fake Images implementation — the binding's local
 * polyfill is not available inside the test pool, and nothing here should
 * depend on it.
 */

import { ulid } from "ulidx";
import { insertDraft, getDraft, nextPendingDraft } from "../db/submissions";
import { writeFtsRow } from "../db/fts";
import { slugify, dedupeSlug } from "./slug";
import { variantsFor, variantKey } from "./variants";

export type ImagesLike = {
  info(stream: ReadableStream): Promise<{ format: string; width: number; height: number; fileSize?: number }>;
  input(stream: ReadableStream): {
    transform(t: { width: number }): {
      output(o: { format: string; quality: number }): Promise<{ response(): Response }>;
    };
  };
};

export type AdminEnv = { db: D1Database; media: R2Bucket; images: ImagesLike };

/** Formats the Images binding accepts as input and the gallery can serve. */
const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/avif": "avif",
};

const MAX_BYTES = 20 * 1024 * 1024; // the Images binding's input ceiling

export async function handleUpload(
  env: AdminEnv,
  file: File,
): Promise<{ ok: true; id: string; url: string } | { ok: false; status: number; error: string }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength === 0) return { ok: false, status: 400, error: "Empty file" };
  if (bytes.byteLength > MAX_BYTES) return { ok: false, status: 413, error: "Over 20 MB" };

  // The bytes are the authority on format and dimensions; the client's
  // claimed content type is discarded (spec 02's rule).
  let info: { format: string; width: number; height: number };
  try {
    info = await env.images.info(streamOf(bytes));
  } catch {
    return { ok: false, status: 415, error: "Not a decodable image" };
  }
  const ext = EXT[info.format];
  if (!ext) return { ok: false, status: 415, error: `Unsupported format ${info.format}` };

  const id = ulid();
  const r2Key = `submissions/${id}.${ext}`;
  await env.media.put(r2Key, bytes, { httpMetadata: { contentType: info.format } });
  await insertDraft(env.db, {
    id, r2Key, width: info.width, height: info.height, byteSize: bytes.byteLength,
  });

  return { ok: true, id, url: `/admin/new?draft=${id}` };
}

export function streamOf(bytes: Uint8Array<ArrayBuffer>): ReadableStream {
  return new Blob([bytes]).stream();
}

const VARIANT_QUALITY = 82; // spec 02, matching scripts/build-variants.ts

export type PublishFields = {
  title: string;
  appName: string;
  appUrl?: string;
  deviceType: string;
  os: string;
  tagSlugs: string[];
};

export async function handlePublish(
  env: AdminEnv,
  draftId: string,
  f: PublishFields,
): Promise<
  { ok: true; slug: string; nextDraft: string | null } | { ok: false; status: number; error: string }
> {
  const missing = [
    !f.title?.trim() && "title",
    !f.appName?.trim() && "app name",
    !f.deviceType && "device",
    !f.os && "os",
    f.tagSlugs.length === 0 && "tags",
  ].filter(Boolean);
  if (missing.length) return { ok: false, status: 422, error: `Missing: ${missing.join(", ")}` };

  const draft = await getDraft(env.db, draftId);
  if (!draft) return { ok: false, status: 404, error: "No pending draft with that id" };

  const tags = (
    await env.db
      .prepare(
        `SELECT id, slug, label FROM tags WHERE slug IN (${f.tagSlugs.map(() => "?").join(",")})`,
      )
      .bind(...f.tagSlugs)
      .all<{ id: number; slug: string; label: string }>()
  ).results;
  if (tags.length !== f.tagSlugs.length) {
    return { ok: false, status: 422, error: "Unknown tag" };
  }

  // Same collision rule as the importer: base slug, then -2, -3, ...
  const base = slugify(f.title.trim(), f.appName.trim());
  const taken = new Set(
    (
      await env.db
        .prepare("SELECT slug FROM states WHERE slug = ? OR slug LIKE ? || '-%'")
        .bind(base, base)
        .all<{ slug: string }>()
    ).results.map((r) => r.slug),
  );
  const slug = dedupeSlug(base, taken);

  // R2 first, D1 batch second, source delete last: a failure anywhere before
  // the batch leaves a pending draft whose retry overwrites these same keys
  // (the state id is the draft id), and no partial states row can exist.
  const source = await env.media.get(draft.r2_key);
  if (!source) return { ok: false, status: 500, error: "Draft image missing from R2" };
  const bytes = new Uint8Array(await source.arrayBuffer());
  const contentType = source.httpMetadata?.contentType ?? "application/octet-stream";
  const ext = draft.r2_key.split(".").pop() as string;
  const originalKey = `originals/${draft.id}.${ext}`;
  await env.media.put(originalKey, bytes, { httpMetadata: { contentType } });

  for (const w of variantsFor(draft.width)) {
    const out = await env.images
      .input(streamOf(bytes))
      .transform({ width: w })
      .output({ format: "image/webp", quality: VARIANT_QUALITY });
    const body = new Uint8Array(await out.response().arrayBuffer());
    await env.media.put(variantKey(w, draft.id), body, {
      httpMetadata: { contentType: "image/webp" },
    });
  }

  const now = new Date().toISOString();
  await env.db.batch([
    env.db
      .prepare(
        `INSERT INTO states
           (id, slug, title, app_name, app_url, device_type, os, r2_key,
            width, height, aspect_ratio, byte_size, status, is_legacy,
            published_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 0, ?, ?)`,
      )
      .bind(
        draft.id, slug, f.title.trim(), f.appName.trim(), f.appUrl?.trim() || null,
        f.deviceType, f.os, originalKey,
        draft.width, draft.height, draft.aspect_ratio, draft.byte_size,
        now, now,
      ),
    ...tags.map((t) =>
      env.db
        .prepare("INSERT INTO state_tags (state_id, tag_id) VALUES (?, ?)")
        .bind(draft.id, t.id),
    ),
    ...writeFtsRow(env.db, {
      stateId: draft.id,
      title: f.title.trim(),
      appName: f.appName.trim(),
      tags: tags.map((t) => t.label).join(" "),
    }),
    env.db
      .prepare(
        `UPDATE submissions
            SET status = 'approved', title = ?, app_name = ?, device_type = ?,
                os = ?, tags_json = ?, reviewed_at = ?, published_state_id = ?
          WHERE id = ?`,
      )
      .bind(
        f.title.trim(), f.appName.trim(), f.deviceType, f.os,
        JSON.stringify(f.tagSlugs), now, draft.id, draft.id,
      ),
  ]);

  // Best-effort: a stray submissions/ object under a published row is the
  // acceptable failure mode; a deleted source under a pending draft is not.
  await env.media.delete(draft.r2_key);

  return { ok: true, slug, nextDraft: await nextPendingDraft(env.db, draft.id) };
}
