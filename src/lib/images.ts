/**
 * Picks which stored image a state should be served as.
 *
 * The never-upscale rule in `variants.ts` decides what exists in R2, so the
 * same rule has to decide what a page asks for. Naming `w1280` for every card
 * would 404 for 206 of 235 states, since most of this corpus is Tumblr-era
 * screenshots at 1280 or less.
 */

import { mediaUrl } from "./media";
import { variantKey, variantsFor } from "./variants";

export type ImageSubject = {
  id: string;
  r2_key: string;
  width: number;
};

export type ImageSources = {
  src: string;
  /** Empty when the original earned no variant; omit the attribute then. */
  srcset: string;
};

export function imageSources(
  state: ImageSubject,
  base?: string,
): ImageSources {
  const widths = variantsFor(state.width);

  // Under 640 wide, so nothing was written. The original is the only copy, and
  // it is already small enough to serve.
  if (widths.length === 0) {
    return { src: mediaUrl(state.r2_key, base), srcset: "" };
  }

  return {
    src: mediaUrl(variantKey(widths[0], state.id), base),
    srcset: widths
      .map((w) => `${mediaUrl(variantKey(w, state.id), base)} ${w}w`)
      .join(", "),
  };
}
