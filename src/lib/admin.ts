/**
 * Admin capture: upload and publish orchestration.
 *
 * Bindings arrive as parameters (the `src/db` convention), so the whole flow
 * runs under vitest with a fake Images implementation — the binding's local
 * polyfill is not available inside the test pool, and nothing here should
 * depend on it.
 */

import { ulid } from "ulidx";
import { insertDraft } from "../db/submissions";

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
