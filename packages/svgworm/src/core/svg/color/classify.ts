import type { XastRoot } from '../tree.ts';

import { CURRENT_COLOR, countColorClusters } from './colors.ts';
import {
  collectPaints,
  PaintAttr,
  type PaintFlag,
  type PaintSite,
} from './paint.ts';

export const ColorKind = { MONO: 'mono', MULTICOLOR: 'multicolor' } as const;
export type ColorKind = (typeof ColorKind)[keyof typeof ColorKind];

export type Classification = {
  readonly kind: ColorKind;
  /** Effective colors, sorted. Includes `currentColor` when an icon already uses it. */
  readonly colors: readonly string[];
  readonly flags: readonly PaintFlag[];
  /** True when the icon relies on the SVG default black fill. */
  readonly usesDefaultFill: boolean;
  readonly sites: readonly PaintSite[];
};

// ADR-0004: colors within 8 per channel count as one.
export const COLOR_TOLERANCE = 8;

/**
 * Mono when the icon paints with one color (or only `currentColor`), multicolor otherwise.
 * Patterns, images and foreign content force multicolor. Never fails: the error it can make
 * is the safe one, keeping an icon multicolor (ADR-0004).
 */
export const classifyIcon = (root: XastRoot): Classification => {
  const { sites, flags } = collectPaints(root);
  const colors = [...new Set(sites.map((site) => site.color))].toSorted();
  const literals = colors.filter((color) => color !== CURRENT_COLOR);
  const distinct =
    countColorClusters(literals, COLOR_TOLERANCE) +
    (colors.includes(CURRENT_COLOR) ? 1 : 0);
  return {
    kind:
      flags.size > 0 || distinct > 1 ? ColorKind.MULTICOLOR : ColorKind.MONO,
    colors,
    flags: [...flags].toSorted(),
    usesDefaultFill: sites.some(
      (site) => site.node === null && site.attr === PaintAttr.FILL,
    ),
    sites,
  };
};
