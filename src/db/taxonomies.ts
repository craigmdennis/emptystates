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
