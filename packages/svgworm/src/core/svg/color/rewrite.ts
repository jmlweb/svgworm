import type { Classification } from './classify.ts';

import {
  isElement,
  removeAttribute,
  setAttribute,
  type XastElement,
  type XastRoot,
} from '../tree.ts';
import { CURRENT_COLOR } from './colors.ts';

// Masks and clip paths keep their own paint: recoloring them changes the shape, not the color.
const KEEPS_OWN_PAINT = new Set(['mask', 'clipPath']);

// A mask inherits paint from where it is declared, not from the element it masks, so its
// inherited fill must be explicit before the root default changes (LRN-006).
const freezeMaskFills = (element: XastElement, inheritedFill: string): void => {
  const fill = element.attributes['fill'] ?? inheritedFill;
  if (element.name === 'mask' && element.attributes['fill'] === undefined) {
    setAttribute(element, 'fill', fill);
  }
  element.children.filter(isElement).forEach((child) => {
    freezeMaskFills(child, fill);
  });
};

const dropColorAttribute = (element: XastElement): void => {
  if (KEEPS_OWN_PAINT.has(element.name)) return;
  removeAttribute(element, 'color');
  element.children.filter(isElement).forEach(dropColorAttribute);
};

/**
 * ADR-0004 mono rewrite. Mutates `root`: every effective paint value becomes `currentColor`
 * on the element that declares it, never on the root, except for the implicit black fill.
 */
export const rewriteToCurrentColor = (
  root: XastRoot,
  classification: Classification,
): void => {
  const svg = root.children.find(isElement);
  if (svg === undefined) return;
  classification.sites.forEach((site) => {
    if (site.node !== null) setAttribute(site.node, site.attr, CURRENT_COLOR);
  });
  if (classification.usesDefaultFill) {
    freezeMaskFills(svg, 'black');
    setAttribute(svg, 'fill', CURRENT_COLOR);
  }
  dropColorAttribute(svg);
};
