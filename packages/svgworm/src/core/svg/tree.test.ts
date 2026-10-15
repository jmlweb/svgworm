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
    // A namespace prefix does not make a script something else.
    [
      '<svg viewBox="0 0 1 1"><x:script xmlns:x="http://www.w3.org/2000/svg">alert(1)</x:script></svg>',
      'svg/forbidden-element',
    ],
    [
      '<svg viewBox="0 0 1 1"><foreignObject><h:script xmlns:h="http://www.w3.org/1999/xhtml">alert(1)</h:script></foreignObject></svg>',
      'svg/forbidden-element',
    ],
    // CSS escapes: `\75rl(` is `url(`.
    [
      '<svg viewBox="0 0 1 1"><rect filter="\\75rl(https://x/t.svg#a)"/></svg>',
      'svg/external-reference',
    ],
    [
      '<svg viewBox="0 0 1 1"><style>.a{mask:\\75 rl(//x/m.svg#a)}</style></svg>',
      'svg/external-reference',
    ],
    // HTML elements inside an SVG load documents or rewrite the page (TSK-067 security review).
    [
      '<svg viewBox="0 0 1 1"><h:iframe xmlns:h="http://www.w3.org/1999/xhtml" srcdoc="&lt;script&gt;x()&lt;/script&gt;"/></svg>',
      'svg/forbidden-element',
    ],
    [
      '<svg viewBox="0 0 1 1"><h:base xmlns:h="http://www.w3.org/1999/xhtml" href="https://x/"/></svg>',
      'svg/forbidden-element',
    ],
    [
      '<svg viewBox="0 0 1 1"><h:meta xmlns:h="http://www.w3.org/1999/xhtml" http-equiv="refresh" content="0;url=https://x/"/></svg>',
      'svg/forbidden-element',
    ],
    [
      '<svg viewBox="0 0 1 1"><h:img xmlns:h="http://www.w3.org/1999/xhtml" src="https://x/a.png"/></svg>',
      'svg/forbidden-element',
    ],
    [
      '<svg viewBox="0 0 1 1"><h:form xmlns:h="http://www.w3.org/1999/xhtml" action="https://x/"/></svg>',
      'svg/forbidden-element',
    ],
    [
      '<svg viewBox="0 0 1 1"><rect src="https://x/a.png"/></svg>',
      'svg/external-reference',
    ],
    [
      '<svg viewBox="0 0 1 1"><rect data="https://x/a.svg"/></svg>',
      'svg/external-reference',
    ],
    // Whitespace inside the scheme is ignored by browsers.
    [
      '<svg viewBox="0 0 1 1"><a href="java&#9;script:alert(1)"/></svg>',
      'svg/forbidden-attribute',
    ],
    [
      '<svg viewBox="0 0 1 1"><a href=" javascript:alert(1)"/></svg>',
      'svg/forbidden-attribute',
    ],
    // SMIL retargeting a link or a handler.
    [
      '<svg viewBox="0 0 1 1"><a href="#a"><set attributeName="href" to="#b"/></a></svg>',
      'svg/forbidden-attribute',
    ],
    [
      '<svg viewBox="0 0 1 1"><rect><animate attributeName="onload" to="x"/></rect></svg>',
      'svg/forbidden-attribute',
    ],
    // Only raster data URLs; an SVG data URL is a document.
    [
      '<svg viewBox="0 0 1 1"><use href="data:image/svg+xml,%3Csvg%3E"/></svg>',
      'svg/forbidden-attribute',
    ],
    [
      '<svg viewBox="0 0 1 1"><image href="data:text/html,x"/></svg>',
      'svg/forbidden-attribute',
    ],
  ])('%s', (text, code) => {
    expect(errorsOf(text).map((error) => error.code)).toContain(code);
  });

  it('still accepts SMIL that animates paint and raster data images', () => {
    expect(
      errorsOf(
        '<svg viewBox="0 0 1 1"><rect fill="red"><animate attributeName="fill" to="blue"/></rect><image href="data:image/webp;base64,AAAA"/></svg>',
      ),
    ).toEqual([]);
  });
});
