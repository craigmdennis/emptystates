/**
 * Whether a title is the filename the image arrived with.
 *
 * 153 of 235 published entries carry one, because Netlify CMS wrote no title
 * and the importer had nothing else to use. The design does not hide them — it
 * sets them in mono, truncates them from the head so the distinctive tail
 * survives, and says once on the detail page that no title was recorded.
 *
 * Filename-shaped, not Tumblr-shaped: uploads will keep arriving with the
 * same problem under different names.
 */
export function isPlaceholderTitle(title: string): boolean {
  return !/\s/.test(title) && title.includes("_");
}
