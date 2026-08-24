/**
 * Which device a screenshot's shape suggests.
 *
 * The ranges in `device_types` overlap deliberately (0001_taxonomies.sql), so
 * "first active match by sort_order" is the rule, and the capture screen
 * shows the answer as a confirmable pre-selection — never a silent write.
 */

export type DeviceRange = {
  slug: string;
  min_ratio: number | null;
  max_ratio: number | null;
  sort_order: number;
  is_active: number;
};

export function deriveDevice(ratio: number, devices: DeviceRange[]): string | null {
  const match = devices
    .filter((d) => d.is_active === 1 && d.min_ratio !== null && d.max_ratio !== null)
    .sort((a, b) => a.sort_order - b.sort_order)
    .find((d) => ratio >= (d.min_ratio as number) && ratio <= (d.max_ratio as number));
  return match?.slug ?? null;
}
