/**
 * The admin's reads and writes of `submissions`.
 *
 * A draft is a pending admin-sourced row: the image is in R2 and measured,
 * and the metadata is still owed. The review queue (#35) reads the same
 * table, so these stay narrow — admin rows only, pending only.
 */

export type DraftRow = {
  id: string;
  r2_key: string;
  width: number;
  height: number;
  aspect_ratio: number;
  byte_size: number;
  created_at: string;
};

const DRAFT = "source = 'admin' AND status = 'pending'";

export async function insertDraft(
  db: D1Database,
  d: { id: string; r2Key: string; width: number; height: number; byteSize: number },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO submissions
         (id, status, source, r2_key, width, height, aspect_ratio, byte_size, created_at)
       VALUES (?, 'pending', 'admin', ?, ?, ?, ?, ?, ?)`,
    )
    .bind(d.id, d.r2Key, d.width, d.height, d.width / d.height, d.byteSize,
          new Date().toISOString())
    .run();
}

export async function getDraft(db: D1Database, id: string): Promise<DraftRow | null> {
  return db
    .prepare(
      `SELECT id, r2_key, width, height, aspect_ratio, byte_size, created_at
         FROM submissions WHERE id = ? AND ${DRAFT}`,
    )
    .bind(id)
    .first<DraftRow>();
}

export async function nextPendingDraft(
  db: D1Database,
  excludeId?: string,
): Promise<string | null> {
  const row = await db
    .prepare(
      `SELECT id FROM submissions
        WHERE ${DRAFT} AND id != ?
        ORDER BY created_at ASC, id ASC LIMIT 1`,
    )
    .bind(excludeId ?? "")
    .first<{ id: string }>();
  return row?.id ?? null;
}

export async function countPendingDrafts(db: D1Database): Promise<number> {
  const row = await db
    .prepare(`SELECT COUNT(*) AS n FROM submissions WHERE ${DRAFT}`)
    .first<{ n: number }>();
  return row?.n ?? 0;
}
