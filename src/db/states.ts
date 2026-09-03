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
  /** Combined with AND: an entry has to carry every one of them. */
  tags?: string[];
};

/**
 * One page of the gallery, newest first, with the total number of matches so
 * the caller can build pagination without a second round of query-building.
 */
export async function listStates(
  db: D1Database,
  { page, perPage, device, os, tags = [] }: ListOptions,
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
  // One EXISTS per tag, which is what ANDing them means: every clause has to
  // find a row. EXISTS instead of a join because a state carries several tags,
  // and joining would return it once per match and break both the count and
  // the page size.
  for (const tag of tags) {
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

/**
 * One row by id, whatever its status. Admin only: the edit screen has to
 * reach an unpublished state, which every other read here hides.
 */
export async function getStateById(
  db: D1Database,
  id: string,
): Promise<(StateRow & { status: "published" | "draft" }) | null> {
  return db
    .prepare(`SELECT ${COLUMNS}, status FROM states s WHERE s.id = ?`)
    .bind(id)
    .first<StateRow & { status: "published" | "draft" }>();
}

/** Unpublished states, newest first, for the admin's draft index. */
export async function listDraftStates(db: D1Database): Promise<StateRow[]> {
  const { results } = await db
    .prepare(`SELECT ${COLUMNS} FROM states s WHERE s.status = 'draft' ORDER BY s.id DESC`)
    .all<StateRow>();
  return results;
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
 * previous and next links.
 *
 * `next` is the **older** entry. The gallery is ordered newest first, so the
 * tile after the one a reader clicked is the older one, and next means the
 * next tile along — not the next date. Reading order is what someone stepping
 * through a grid has in mind; chronology is not.
 *
 * `position` counts the same way, so following Next counts up.
 */
export async function getAdjacent(
  db: D1Database,
  publishedAt: string,
): Promise<{
  prev: StateRow | null;
  next: StateRow | null;
  /** 1-based, newest first, so it counts up as Next is followed. */
  position: number;
}> {
  const [next, prev, newer] = await Promise.all([
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
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM states
          WHERE status = 'published' AND published_at > ?`,
      )
      .bind(publishedAt)
      .first<{ n: number }>(),
  ]);

  return { prev, next, position: (newer?.n ?? 0) + 1 };
}

export type StateTag = {
  slug: string;
  label: string;
};

/**
 * One entry's tags, as links back to the filtered gallery.
 *
 * Not on `StateRow`: tags live in a join table, and selecting them alongside
 * the row would either need a second round trip per state in the gallery or a
 * group_concat nothing else wants.
 */
export async function listStateTags(
  db: D1Database,
  stateId: string,
): Promise<StateTag[]> {
  const { results } = await db
    .prepare(
      `SELECT t.slug, t.label
         FROM tags t
         JOIN state_tags st ON st.tag_id = t.id
        WHERE st.state_id = ?
        ORDER BY t.label`,
    )
    .bind(stateId)
    .all<StateTag>();

  return results;
}

/**
 * How many entries the collection holds, for the header on every page.
 *
 * Separate from `listStates` because the pages that show no gallery — detail,
 * privacy — still print the number, and none of them may reach for a raw
 * COUNT that forgets `status = 'published'`.
 */
export async function countStates(db: D1Database): Promise<number> {
  const row = await db
    .prepare("SELECT COUNT(*) AS n FROM states WHERE status = 'published'")
    .first<{ n: number }>();
  return row?.n ?? 0;
}
