import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  findLeftoverStyles,
  normalizeStyles,
  optimizeMarkup,
} from './optimize.ts';
import { parseSvgTree } from './tree.ts';

const fixture = (name: string): string =>
  readFileSync(
    new URL(`../../../../../fixtures/${name}`, import.meta.url),
    'utf8',
  );

const leftoverCodes = (text: string): readonly string[] => {
  const parsed = parseSvgTree(normalizeStyles(text));
  if (!parsed.ok) throw new Error(parsed.message);
  return findLeftoverStyles(parsed.root, 'x.svg').map((error) => error.code);
};

describe('normalizeStyles', () => {
  it('inlines class rules into presentation attributes and drops the <style>', () => {
    const output = normalizeStyles(fixture('style/illustrator-mono.svg'));
    expect(output).not.toContain('<style');
    expect(output).not.toContain('class=');
    expect(output).toMatch(/fill="#[0-9a-fA-F]{3,6}"/);
  });

  it('turns style="" declarations into attributes', () => {
    const output = normalizeStyles(
      '<svg viewBox="0 0 1 1"><path style="fill:#f00;stroke:#00f" d="M0 0h1v1z"/></svg>',
    );
    // minifyStyles may spell the color as its CSS name; normalizeColor maps both back.
    expect(output).toMatch(/fill="(#f00|red)"/);
    expect(output).toContain('stroke="#00f"');
    expect(output).not.toContain('style=');
  });
});

describe('findLeftoverStyles', () => {
  it('finds nothing after a full inline', () => {
    expect(leftoverCodes(fixture('style/illustrator-multicolor.svg'))).toEqual(
      [],
    );
  });

  it('flags an @media rule as unscopable', () => {
    expect(leftoverCodes(fixture('style/unscopable-media.svg'))).toEqual([
      'style/unscopable',
    ]);
  });

  // RPT-007: Illustrator exports carry every document class (.st0….st36), most unused.
  it('drops rules whose selectors match nothing instead of failing', () => {
    expect(
      leftoverCodes(
        '<svg viewBox="0 0 1 1"><style>.st0{fill:#000}.st1{fill:red}.st2:hover{fill:blue}</style><path class="st0" d="M0 0h1v1z"/></svg>',
      ),
    ).toEqual([]);
  });

  it('names the selectors left in the message', () => {
    const parsed = parseSvgTree(
      normalizeStyles(
        '<svg viewBox="0 0 1 1"><style>.a:hover{fill:red}</style><path class="a" d="M0 0h1v1z"/></svg>',
      ),
    );
    if (!parsed.ok) throw new Error(parsed.message);
    const [error] = findLeftoverStyles(parsed.root, 'x.svg');
    expect(error?.code).toBe('style/leftover');
    expect(error?.message).toContain('.a:hover');
    expect(error?.message).not.toContain('such as');
  });

  it('flags a rule that cannot be inlined', () => {
    expect(
      leftoverCodes(
        '<svg viewBox="0 0 1 1"><style>path:hover{fill:red}</style><path d="M0 0h1v1z"/></svg>',
      ),
    ).toEqual(['style/leftover']);
  });
});

describe('optimizeMarkup', () => {
  const input =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><!-- c --><title>Layer 1</title><desc>d</desc><g><path fill="#000000" d="M 4.000 4 L 20 4 L 20 20 z"/></g></svg>';

  it('keeps the viewBox and strips comments, title and desc', () => {
    const output = optimizeMarkup(input);
    expect(output).toContain('viewBox="0 0 24 24"');
    expect(output).not.toMatch(/<!--|<title|<desc/);
  });

  it('replaces xlink:href with href and drops the namespace', () => {
    const output = optimizeMarkup(
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><defs><path id="p" d="M0 0h9v9z"/></defs><use xlink:href="#p"/></svg>',
    );
    expect(output).toContain('href="#p"');
    expect(output).not.toContain('xlink');
  });

  it('is deterministic', () => {
    expect(optimizeMarkup(input)).toBe(optimizeMarkup(input));
  });

  it('keeps ids readable so later steps can rename them', () => {
    const output = optimizeMarkup(fixture('gradient/logos-kotlin.svg'));
    expect(output).toMatch(/id="[A-Za-z0-9_-]+"/);
  });
});
