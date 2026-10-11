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
    expect(output).toContain('fill="#f00"');
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

  it('is deterministic', () => {
    expect(optimizeMarkup(input)).toBe(optimizeMarkup(input));
  });

  it('keeps ids readable so later steps can rename them', () => {
    const output = optimizeMarkup(fixture('gradient/logos-kotlin.svg'));
    expect(output).toMatch(/id="[A-Za-z0-9_-]+"/);
  });
});
