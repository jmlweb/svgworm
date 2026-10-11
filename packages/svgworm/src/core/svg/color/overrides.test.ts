import { describe, expect, it } from 'vitest';

import { resolveColorMode } from './overrides.ts';

describe('resolveColorMode', () => {
  it('defaults to auto', () => {
    expect(resolveColorMode('home', [])).toBe('auto');
  });

  it('matches globs against the public name', () => {
    const rules = [{ match: 'brand/**', color: 'preserve' }] as const;
    expect(resolveColorMode('brand/logo', rules)).toBe('preserve');
    expect(resolveColorMode('brand/deep/logo', rules)).toBe('preserve');
    expect(resolveColorMode('home', rules)).toBe('auto');
  });

  it('lets the last matching rule win', () => {
    const rules = [
      { match: '**', color: 'mono' },
      { match: 'brand/*', color: 'preserve' },
      { match: 'brand/special', color: 'auto' },
    ] as const;
    expect(resolveColorMode('home', rules)).toBe('mono');
    expect(resolveColorMode('brand/logo', rules)).toBe('preserve');
    expect(resolveColorMode('brand/special', rules)).toBe('auto');
  });

  it('matches non-ASCII names', () => {
    expect(resolveColorMode('café', [{ match: 'caf*', color: 'mono' }])).toBe(
      'mono',
    );
  });
});
