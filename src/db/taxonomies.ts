/**
 * Facet counts for the gallery's filter bar.
 *
 * Counted from `states` and joined to the taxonomy tables for their labels and
 * order, so an option appears when something published carries it. The
 * taxonomies list six device types and six operating systems, and offering all
 * twelve would put filters in front of a reader that return an empty gallery.
 *
 * A null `os` is a missing answer, never a value: 137 legacy entries carry no
 * OS tag, and grouping them under a label would invent one.
 */

export type Facet = {
  slug: string;
  label: string;
  count: number;
};

/**
 * Reads for the admin capture screen: every active option to choose from,
 * plus the app names already in the gallery for the datalist. Unlike
 * `listFacets`, these are not gated on anything being published under them —
 * an admin picking a brand-new device or app name is the point.
 */

export type DeviceRangeOption = {
  slug: string;
  label: string;
  min_ratio: number | null;
  max_ratio: number | null;
  sort_order: number;
  is_active: number;
};

export async function listDeviceRanges(
  db: D1Database,
): Promise<DeviceRangeOption[]> {
  const { results } = await db
    .prepare(
      `SELECT slug, label, min_ratio, max_ratio, sort_order, is_active
         FROM device_types WHERE is_active = 1 ORDER BY sort_order`,
    )
    .all<DeviceRangeOption>();
  return results;
}

export async function listOsOptions(
  db: D1Database,
): Promise<{ slug: string; label: string }[]> {
  const { results } = await db
    .prepare(
      `SELECT slug, label FROM operating_systems WHERE is_active = 1 ORDER BY sort_order`,
    )
    .all<{ slug: string; label: string }>();
  return results;
}

export async function listTagOptions(
  db: D1Database,
): Promise<{ slug: string; label: string }[]> {
  const { results } = await db
    .prepare(`SELECT slug, label FROM tags ORDER BY label`)
    .all<{ slug: string; label: string }>();
  return results;
}

export async function listAppNames(db: D1Database): Promise<string[]> {
  const { results } = await db
    .prepare(
      `SELECT DISTINCT app_name FROM states WHERE app_name IS NOT NULL ORDER BY app_name`,
    )
    .all<{ app_name: string }>();
  return results.map((r) => r.app_name);
}

export async function listFacets(db: D1Database): Promise<{
  devices: Facet[];
  oses: Facet[];
  tags: Facet[];
}> {
  const [devices, oses, tags] = await Promise.all([
    db
      .prepare(
        `SELECT d.slug, d.label, COUNT(s.id) AS count
           FROM device_types d
           JOIN states s ON s.device_type = d.slug AND s.status = 'published'
          WHERE d.is_active = 1
          GROUP BY d.slug, d.label, d.sort_order
         HAVING COUNT(s.id) > 0
          ORDER BY d.sort_order`,
      )
      .all<Facet>(),
    db
      .prepare(
        `SELECT o.slug, o.label, COUNT(s.id) AS count
           FROM operating_systems o
           JOIN states s ON s.os = o.slug AND s.status = 'published'
          WHERE o.is_active = 1
          GROUP BY o.slug, o.label, o.sort_order
         HAVING COUNT(s.id) > 0
          ORDER BY o.sort_order`,
      )
      .all<Facet>(),
    db
      .prepare(
        `SELECT t.slug, t.label, COUNT(st.state_id) AS count
           FROM tags t
           JOIN state_tags st ON st.tag_id = t.id
           JOIN states s ON s.id = st.state_id AND s.status = 'published'
          GROUP BY t.slug, t.label
         HAVING COUNT(st.state_id) > 0
          ORDER BY count DESC, t.label`,
      )
      .all<Facet>(),
  ]);

  return {
    devices: devices.results,
    oses: oses.results,
    tags: tags.results,
  };
}
