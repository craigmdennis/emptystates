/**
 * The single writer for `states_fts`.
 *
 * `states_fts` is a standalone FTS5 table, not external-content backed, because
 * tags and colours live in join tables and external content requires every
 * indexed column on the content table. Standalone means nothing keeps it in
 * sync automatically — every write to `states`, `state_tags` or `state_colors`
 * has to rewrite the row itself.
 *
 * This returns prepared statements instead of executing them, so callers put
 * them in the same `db.batch()` as the write that made them necessary. That is
 * what makes "in the same transaction" an enforced property rather than a note
 * in a spec that a future caller forgets to honour.
 */

export type FtsRow = {
  stateId: string;
  title: string;
  appName?: string | null;
  /** Space-separated tag labels. */
  tags?: string | null;
  /** Space-separated colour names, e.g. 'navy blue dark cool'. */
  colors?: string | null;
  screenText?: string | null;
  description?: string | null;
};

export function writeFtsRow(
  db: D1Database,
  row: FtsRow,
): D1PreparedStatement[] {
  return [
    // Delete first: FTS5 has no UPSERT, so a rewrite is a replace.
    db.prepare("DELETE FROM states_fts WHERE state_id = ?").bind(row.stateId),
    db
      .prepare(
        `INSERT INTO states_fts
           (title, app_name, tags, colors, screen_text, description, state_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        row.title,
        row.appName ?? "",
        row.tags ?? "",
        row.colors ?? "",
        row.screenText ?? "",
        row.description ?? "",
        row.stateId,
      ),
  ];
}
