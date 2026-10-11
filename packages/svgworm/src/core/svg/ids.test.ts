import { describe, expect, it } from 'vitest';

import { renameIds } from './ids.ts';
import { mutateSvgTree } from './tree.ts';

const svg = (body: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24">${body}</svg>`;

const rename = (text: string, symbolId = 'i-icon'): string =>
  mutateSvgTree(text, (root) => {
    renameIds(root, symbolId);
  }).data;

describe('renameIds', () => {
  it('numbers ids from 1 in document order', () => {
    const output = rename(
      svg(
        '<defs><linearGradient id="zeta"/><clipPath id="alpha"/></defs><rect fill="url(#zeta)" clip-path="url(#alpha)"/>',
      ),
    );
    expect(output).toContain('<linearGradient id="i-icon_1"/>');
    expect(output).toContain('<clipPath id="i-icon_2"/>');
    expect(output).toContain('fill="url(#i-icon_1)"');
    expect(output).toContain('clip-path="url(#i-icon_2)"');
  });

  it('gives the same output whatever the source ids are called', () => {
    const body = (a: string, b: string): string =>
      svg(
        `<defs><mask id="${a}"/><filter id="${b}"/></defs><g mask="url(#${a})" filter="url(#${b})"/>`,
      );
    expect(rename(body('a', 'b'))).toBe(rename(body('Layer_1-mask', 'x9')));
  });

  it('rewrites quoted url() references, href and style declarations', () => {
    const output = rename(
      svg(
        `<defs><g id="shape"/><linearGradient id="g"/></defs><use href="#shape"/><use xlink:href="#shape"/><rect fill="url('#g')" style="stroke:url( &quot;#g&quot; )"/>`,
      ),
    );
    expect(output).not.toMatch(/#shape|#g\b/);
    expect(output.match(/#i-icon_1/g)).toHaveLength(2);
    expect(output.match(/#i-icon_2/g)).toHaveLength(2);
  });

  it('rewrites SMIL begin and end references', () => {
    const output = rename(
      svg(
        '<circle id="c" r="1"><animate id="a" attributeName="r" to="2" begin="0s;b.end"/></circle><animate id="b" begin="a.end+1s" end="c.click"/>',
      ),
    );
    expect(output).toContain('begin="0s;i-icon_3.end"');
    expect(output).toContain('begin="i-icon_2.end+1s"');
    expect(output).toContain('end="i-icon_1.click"');
  });

  it('leaves references to unknown ids alone', () => {
    const output = rename(svg('<rect fill="url(#missing)"/>'));
    expect(output).toContain('fill="url(#missing)"');
  });

  it('does not number the root element', () => {
    const output = rename(
      '<svg xmlns="http://www.w3.org/2000/svg" id="root" viewBox="0 0 1 1"><g id="a"/></svg>',
    );
    expect(output).toContain('<g id="i-icon_1"/>');
  });

  it('returns the old to new mapping', () => {
    const { result } = mutateSvgTree(svg('<g id="x"/><g id="y"/>'), (root) =>
      renameIds(root, 'i-q'),
    );
    expect([...result]).toEqual([
      ['x', 'i-q_1'],
      ['y', 'i-q_2'],
    ]);
  });

  it('never produces a symbol id (an internal id ends in an unclosed _<n>)', () => {
    const { result } = mutateSvgTree(svg('<g id="x"/>'), (root) =>
      renameIds(root, 'i-caf_e9_'),
    );
    expect([...result.values()]).toEqual(['i-caf_e9__1']);
  });
});
