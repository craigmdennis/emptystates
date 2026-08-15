/**
 * Which display sizes an original earns, and where each one lives in R2.
 *
 * Pure, so the never-upscale rule is testable without R2 or sharp. Spec 02's
 * ingest pipeline calls the same functions when a submission arrives, so a
 * variant written today and one written by a future upload agree on both the
 * width set and the key.
 */

/** Widths the gallery and detail page reference, narrowest first. */
export const VARIANT_WIDTHS = [640, 1280, 2560] as const;

export type VariantWidth = (typeof VARIANT_WIDTHS)[number];

/**
 * The widths worth writing for an original this wide.
 *
 * Enlarging an original adds bytes and no detail, and looks worse than letting
 * the browser scale a smaller variant, so a variant is written only when the
 * original is at least that wide. An original narrower than 640 earns none;
 * `srcset` falls back to the largest that exists, which is the original.
 */
export function variantsFor(originalWidth: number): VariantWidth[] {
  return VARIANT_WIDTHS.filter((w) => w <= originalWidth);
}

/** R2 key for one variant. Keyed by state id, which is a ULID and never moves. */
export function variantKey(width: VariantWidth, stateId: string): string {
  return `w${width}/${stateId}.webp`;
}
