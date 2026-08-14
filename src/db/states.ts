/**
 * Every read of `states` the site performs.
 *
 * Callable functions taking a `D1Database`, so no route embeds SQL that a
 * later feature would have to duplicate, and so search in spec 02 extends
 * these rather than growing a second query path.
 *
 * `status = 'published'` is applied here in every query. A draft is an entry
 * whose picture survived without frontmatter, and one reaching the gallery
 * would be a row with a filename for a title.
 */

export type StateRow = {
  id: string;
  slug: string;
  title: string;
  app_name: string | null;
  app_url: string | null;
  device_type: string;
  os: string | null;
  r2_key: string;
  width: number;
  height: number;
  aspect_ratio: number;
  /** The original's size, shown on the detail page's original-image link. */
  byte_size: number;
  description: string | null;
  published_at: string;
  submitter_name: string | null;
  submitter_handle: string | null;
};

const COLUMNS = `id, slug, title, app_name, app_url, device_type, os, r2_key,
                 width, height, aspect_ratio, byte_size, description,
                 published_at, submitter_name, submitter_handle`;

export type ListOptions = {
  page: number;
  perPage: number;
  device?: string;
  os?: string;
  tag?: string;
};

/**
 * One page of the gallery, newest first, with the total number of matches so
 * the caller can build pagination without a second round of query-building.
 */
export async function listStates(
  db: D1Database,
  { page, perPage, device, os, tag }: ListOptions,
): Promise<{ rows: StateRow[]; total: number }> {
  const where = ["s.status = 'published'"];
  const params: unknown[] = [];

  if (device) {
    where.push("s.device_type = ?");
    params.push(device);
  }
  if (os) {
    where.push("s.os = ?");
    params.push(os);
  }
  if (tag) {
    // EXISTS instead of a join: a state carries several tags, and joining would
    // return it once per match and break both the count and the page size.
    where.push(
      `EXISTS (SELECT 1 FROM state_tags st
                 JOIN tags t ON t.id = st.tag_id
                WHERE st.state_id = s.id AND t.slug = ?)`,
    );
    params.push(tag);
  }

  const filter = where.join(" AND ");
  const offset = Math.max(0, (page - 1) * perPage);

  const [rows, total] = await Promise.all([
    db
      .prepare(
        `SELECT ${COLUMNS} FROM states s
          WHERE ${filter}
          ORDER BY s.published_at DESC, s.id DESC
          LIMIT ? OFFSET ?`,
      )
      .bind(...params, perPage, offset)
      .all<StateRow>(),
    db
      .prepare(`SELECT COUNT(*) AS n FROM states s WHERE ${filter}`)
      .bind(...params)
      .first<{ n: number }>(),
  ]);

  return { rows: rows.results, total: total?.n ?? 0 };
}

export async function getStateBySlug(
  db: D1Database,
  slug: string,
): Promise<StateRow | null> {
  return db
    .prepare(
      `SELECT ${COLUMNS} FROM states s
        WHERE s.slug = ? AND s.status = 'published'`,
    )
    .bind(slug)
    .first<StateRow>();
}

/**
 * The entries either side of one publication date, for the detail page's
 * previous and next links. Ordered the way the gallery is, so `next` is the
 * newer entry and `prev` the older one.
 */
export async function getAdjacent(
  db: D1Database,
  publishedAt: string,
): Promise<{ prev: StateRow | null; next: StateRow | null }> {
  const [prev, next] = await Promise.all([
    db
      .prepare(
        `SELECT ${COLUMNS} FROM states s
          WHERE s.status = 'published' AND s.published_at < ?
          ORDER BY s.published_at DESC LIMIT 1`,
      )
      .bind(publishedAt)
      .first<StateRow>(),
    db
      .prepare(
        `SELECT ${COLUMNS} FROM states s
          WHERE s.status = 'published' AND s.published_at > ?
          ORDER BY s.published_at ASC LIMIT 1`,
      )
      .bind(publishedAt)
      .first<StateRow>(),
  ]);

  return { prev, next };
}
