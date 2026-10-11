import { describe, expect, it } from 'vitest';

import { compareCodePoints, compareCodeUnits } from './compare-code-units.ts';

describe('compareCodeUnits', () => {
  it('orders uppercase before lowercase', () => {
    expect(['b', 'a', 'B', 'A'].toSorted(compareCodeUnits)).toEqual([
      'A',
      'B',
      'a',
      'b',
    ]);
  });
});

describe('compareCodePoints', () => {
  it('puts astral characters after U+E000..U+FFFF, unlike code unit order', () => {
    const astral = '\u{20000}';
    const fullWidth = '１';
    expect(compareCodeUnits(astral, fullWidth)).toBeLessThan(0);
    expect(compareCodePoints(astral, fullWidth)).toBeGreaterThan(0);
  });

  it('orders prefixes first and is zero for equal strings', () => {
    expect(compareCodePoints('a', 'ab')).toBeLessThan(0);
    expect(compareCodePoints('ab', 'a')).toBeGreaterThan(0);
    expect(compareCodePoints('x', 'x')).toBe(0);
  });
});
