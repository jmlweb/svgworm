import { describe, expect, it } from 'vitest';

import { normalizeColor } from './colors.ts';

describe('normalizeColor', () => {
  // RPT-007: minifyStyles swaps hex for any shorter CSS name (#d2b48c becomes tan), so every
  // CSS named color must map back to its hex, or the classifier would count it as a new color.
  it.each([
    ['red', '#ff0000'],
    ['tan', '#d2b48c'],
    ['rebeccapurple', '#663399'],
    ['Peru', '#cd853f'],
    ['#F00', '#ff0000'],
    ['currentcolor', 'currentColor'],
  ])('%s is %s', (input, expected) => {
    expect(normalizeColor(input)).toBe(expected);
  });
});
