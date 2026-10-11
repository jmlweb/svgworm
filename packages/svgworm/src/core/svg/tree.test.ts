import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { getSvgRoot, parseSvgTree, parseUrlId, walkElements } from './tree.ts';
import { decodeSource, validateTree } from './validate.ts';

const fixture = (name: string): string =>
  readFileSync(
    new URL(`../../../../../fixtures/${name}`, import.meta.url),
    'utf8',
  );

const errorsOf = (text: string) => {
  const parsed = parseSvgTree(text);
  if (!parsed.ok) return [{ code: 'svg/invalid-xml', message: parsed.message }];
  return validateTree(parsed.root, 'x.svg');
};

describe('parseSvgTree', () => {
  it('parses a document into a tree', () => {
    const parsed = parseSvgTree(
      '<svg xmlns="http://www.w3.org/2000/svg"><g><path d="M0 0"/></g></svg>',
    );
    if (!parsed.ok) throw new Error(parsed.message);
    const names: string[] = [];
    walkElements(parsed.root, (element) => names.push(element.name));
    expect(names).toEqual(['svg', 'g', 'path']);
    expect(getSvgRoot(parsed.root)?.name).toBe('svg');
  });

  it('reports malformed XML', () => {
    expect(parseSvgTree(fixture('invalid/not-xml.svg'))).toMatchObject({
      ok: false,
    });
  });
});

describe('parseUrlId', () => {
  it.each([
    ['url(#a)', 'a'],
    ['url( "#a" )', 'a'],
    ["url('#a-b_1')", 'a-b_1'],
    ['url(https://x/y)', undefined],
    ['red', undefined],
  ])('%s', (value, expected) => {
    expect(parseUrlId(value)).toBe(expected);
  });
});

describe('decodeSource', () => {
  it('decodes UTF-8 and drops the BOM', () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, 0x3c, 0x73]);
    expect(decodeSource(bytes, 'a.svg')).toEqual({ ok: true, text: '<s' });
  });

  it('rejects invalid UTF-8', () => {
    expect(decodeSource(new Uint8Array([0xe9]), 'a.svg')).toMatchObject({
      ok: false,
      error: { code: 'svg/invalid-encoding', file: 'a.svg' },
    });
  });
});

describe('validateTree', () => {
  it('accepts a plain icon', () => {
    expect(errorsOf(fixture('mono-fill/heroicons-home.svg'))).toEqual([]);
  });

  it('accepts internal references and data URIs', () => {
    expect(
      errorsOf(
        '<svg viewBox="0 0 1 1"><use href="#a"/><image href="data:image/png;base64,AAAA"/><rect fill="url(#g)"/></svg>',
      ),
    ).toEqual([]);
  });

  it.each([
    ['invalid/empty.svg', 'svg/not-svg-root'],
    ['invalid/not-svg-root.svg', 'svg/not-svg-root'],
    ['invalid/script.svg', 'svg/forbidden-element'],
    ['invalid/external-ref.svg', 'svg/external-reference'],
  ])('%s -> %s', (file, code) => {
    expect(errorsOf(fixture(file)).map((error) => error.code)).toContain(code);
  });

  it.each([
    [
      '<svg viewBox="0 0 1 1"><rect onclick="x()"/></svg>',
      'svg/forbidden-attribute',
    ],
    [
      '<svg viewBox="0 0 1 1"><a href="javascript:alert(1)"/></svg>',
      'svg/forbidden-attribute',
    ],
    [
      '<svg viewBox="0 0 1 1"><rect style="fill:url(http://x/y#a)"/></svg>',
      'svg/external-reference',
    ],
    [
      '<svg viewBox="0 0 1 1"><style>@import url(https://x/y.css);</style></svg>',
      'svg/external-reference',
    ],
    [
      '<svg xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1 1"><image xlink:href="https://x/a.png"/></svg>',
      'svg/external-reference',
    ],
  ])('%s', (text, code) => {
    expect(errorsOf(text).map((error) => error.code)).toContain(code);
  });
});
