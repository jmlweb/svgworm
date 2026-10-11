import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { parseSvgTree, getSvgRoot } from './tree.ts';
import { resolveViewBox } from './viewbox.ts';

const attributesOf = (name: string): Record<string, string> => {
  const text = readFileSync(
    new URL(`../../../../../fixtures/${name}`, import.meta.url),
    'utf8',
  );
  const parsed = parseSvgTree(text);
  if (!parsed.ok) throw new Error(parsed.message);
  return getSvgRoot(parsed.root)?.attributes ?? {};
};

describe('resolveViewBox', () => {
  it('keeps an existing viewBox', () => {
    expect(resolveViewBox({ viewBox: '0 0 24 24' }, 'a.svg')).toEqual({
      ok: true,
      viewBox: '0 0 24 24',
      isDerived: false,
    });
  });

  it('accepts commas and extra whitespace and rewrites them as single spaces', () => {
    expect(resolveViewBox({ viewBox: ' 0,0  16 , 8 ' }, 'a.svg')).toMatchObject(
      {
        ok: true,
        viewBox: '0 0 16 8',
      },
    );
  });

  it('derives a viewBox from numeric width and height', () => {
    expect(
      resolveViewBox(attributesOf('viewbox-derived/no-viewbox.svg'), 'a.svg'),
    ).toEqual({
      ok: true,
      viewBox: '0 0 24 24',
      isDerived: true,
    });
  });

  it('accepts px units and decimals when deriving', () => {
    expect(
      resolveViewBox({ width: '24px', height: '12.50px' }, 'a.svg'),
    ).toMatchObject({
      ok: true,
      viewBox: '0 0 24 12.5',
      isDerived: true,
    });
  });

  it('prefers the viewBox over width and height', () => {
    expect(
      resolveViewBox(
        { viewBox: '0 0 10 10', width: '99', height: '99' },
        'a.svg',
      ),
    ).toMatchObject({ viewBox: '0 0 10 10', isDerived: false });
  });

  it.each([
    ['percent', { width: '100%', height: '100%' }],
    ['em', { width: '1em', height: '1em' }],
    ['only width', { width: '24' }],
    ['nothing', {}],
    ['zero size', { width: '0', height: '0' }],
  ])('rejects %s without a viewBox', (_label, attributes) => {
    expect(resolveViewBox(attributes, 'a.svg')).toMatchObject({
      ok: false,
      error: { code: 'viewbox/underivable', file: 'a.svg' },
    });
  });

  it('rejects the percent fixture', () => {
    expect(
      resolveViewBox(attributesOf('invalid/percent-size.svg'), 'a.svg'),
    ).toMatchObject({
      ok: false,
    });
  });

  it.each(['0 0 24', '0 0 a b', '0 0 0 24', '0 0 -1 1', '0 0 24 24 1'])(
    'rejects the malformed viewBox %j',
    (viewBox) => {
      expect(resolveViewBox({ viewBox }, 'a.svg')).toMatchObject({
        ok: false,
        error: { code: 'viewbox/invalid' },
      });
    },
  );
});
