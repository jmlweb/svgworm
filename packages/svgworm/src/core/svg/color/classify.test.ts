import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { prepareTree } from '../prepare.ts';
import { parseSvgTree } from '../tree.ts';
import { classifyIcon } from './classify.ts';

const classify = (text: string) => {
  const parsed = prepareTree(text);
  if (!parsed.ok) throw new Error(parsed.message);
  return classifyIcon(parsed.root);
};

const svg = (body: string, attributes = ''): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"${attributes}>${body}</svg>`;

const kindOf = (body: string, attributes = ''): string =>
  classify(svg(body, attributes)).kind;

const fixture = (name: string): string =>
  readFileSync(
    new URL(`../../../../../../fixtures/${name}`, import.meta.url),
    'utf8',
  );

describe('mono and multicolor', () => {
  it('one literal color is mono', () => {
    expect(kindOf('<path fill="#123456" d="M0 0h10v10z"/>')).toBe('mono');
  });

  it('only currentColor is mono', () => {
    expect(kindOf('<path fill="currentColor" d="M0 0h10v10z"/>')).toBe('mono');
  });

  it('two literal colors are multicolor', () => {
    expect(
      kindOf(
        '<path fill="#ff0000" d="M0 0h10v10z"/><path fill="#0000ff" d="M10 10h10v10z"/>',
      ),
    ).toBe('multicolor');
  });

  it('a literal color next to currentColor is multicolor', () => {
    expect(
      kindOf(
        '<path fill="#ff0000" d="M0 0h10v10z"/><path fill="currentColor" d="M10 10h10v10z"/>',
      ),
    ).toBe('multicolor');
  });

  it('merges colors within 8 per channel, not beyond', () => {
    const two = (a: string, b: string): string =>
      kindOf(
        `<path fill="${a}" d="M0 0h10v10z"/><path fill="${b}" d="M10 10h10v10z"/>`,
      );
    expect(two('#101010', '#181818')).toBe('mono');
    expect(two('#101010', '#191919')).toBe('multicolor');
  });

  it('nothing painted is mono', () => {
    expect(kindOf('<path fill="none" d="M0 0h10v10z"/>')).toBe('mono');
  });

  it('normalizes named, short, rgb and alpha-ff colors to one', () => {
    expect(
      kindOf(
        '<path fill="red" d="M0 0h10v10z"/><path fill="#f00" d="M1 1h10v10z"/><path fill="rgb(255,0,0)" d="M2 2h10v10z"/><path fill="#ff0000ff" d="M3 3h10v10z"/>',
      ),
    ).toBe('mono');
  });
});

describe('what counts as painted', () => {
  it('uses the default black fill and says so', () => {
    const result = classify(svg('<path d="M0 0h10v10z"/>'));
    expect(result.kind).toBe('mono');
    expect(result.usesDefaultFill).toBe(true);
  });

  it('does not use the default fill when fill is none and stroke is set', () => {
    const result = classify(
      svg('<path fill="none" stroke="#000" stroke-width="2" d="M0 0l10 10"/>'),
    );
    expect(result.usesDefaultFill).toBe(false);
    expect(result.colors).toEqual(['#000000']);
  });

  it('fill and stroke in different colors are multicolor', () => {
    expect(
      kindOf(
        '<path fill="#111" stroke="#c00" stroke-width="2" d="M0 0h10v10z"/>',
      ),
    ).toBe('multicolor');
  });

  it.each([
    [
      'fill-opacity 0',
      '<path fill="#f00" fill-opacity="0" stroke="none" d="M0 0h10v10z"/>',
    ],
    ['opacity 0', '<path fill="#f00" opacity="0" d="M0 0h10v10z"/>'],
    [
      'visibility hidden',
      '<path fill="#f00" visibility="hidden" d="M0 0h10v10z"/>',
    ],
    [
      'display none',
      '<g display="none"><path fill="#f00" d="M0 0h10v10z"/></g>',
    ],
    [
      'zero stroke width',
      '<path fill="none" stroke="#f00" stroke-width="0" d="M0 0h10v10z"/>',
    ],
  ])('skips %s', (_label, body) => {
    const both = `${body}<path fill="#00f" d="M12 12h10v10z"/>`;
    expect(kindOf(both)).toBe('mono');
  });

  it('ignores the fill of a line', () => {
    // Parsed without the optimizer, which would turn the line into a path.
    const parsed = parseSvgTree(
      svg(
        '<line fill="#f00" stroke="#00f" stroke-width="2" x1="0" y1="0" x2="9" y2="9"/>',
      ),
    );
    if (!parsed.ok) throw new Error(parsed.message);
    expect(classifyIcon(parsed.root).kind).toBe('mono');
  });

  it('follows <use> into a symbol in defs', () => {
    expect(
      kindOf(
        '<defs><g id="a"><path fill="#f00" d="M0 0h10v10z"/></g></defs><use href="#a"/><path fill="#00f" d="M12 12h10v10z"/>',
      ),
    ).toBe('multicolor');
  });

  it('survives a <use> cycle', () => {
    expect(
      kindOf(
        '<g id="a"><use href="#a"/><path fill="#f00" d="M0 0h10v10z"/></g>',
      ),
    ).toBe('mono');
  });

  it('inherits paint from the group and resolves color for currentColor', () => {
    expect(
      kindOf(
        '<g color="#f00" fill="currentColor"><path d="M0 0h10v10z"/></g><path fill="#f00" d="M12 12h10v10z"/>',
      ),
    ).toBe('mono');
  });
});

describe('gradients', () => {
  const gradient = (stops: string): string =>
    `<defs><linearGradient id="g">${stops}</linearGradient></defs><rect width="24" height="24" fill="url(#g)"/>`;

  it('counts every stop', () => {
    expect(
      kindOf(
        gradient(
          '<stop offset="0" stop-color="#f00"/><stop offset="1" stop-color="#00f"/>',
        ),
      ),
    ).toBe('multicolor');
  });

  it('a transparent stop still tints (LRN-005)', () => {
    expect(
      kindOf(
        gradient(
          '<stop offset="0" stop-color="#f00"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>',
        ),
      ),
    ).toBe('multicolor');
    expect(
      classify(fixture('gradient/logos-scaledrone-transparent-stop.svg')).kind,
    ).toBe('multicolor');
  });

  it('ignores a gradient whose stops are all transparent', () => {
    expect(
      kindOf(
        `${gradient('<stop offset="0" stop-color="#f00" stop-opacity="0"/><stop offset="1" stop-color="#00f" stop-opacity="0"/>')}<path fill="#123" d="M0 0h10v10z"/>`,
      ),
    ).toBe('mono');
  });

  it('follows href chains to the stops', () => {
    expect(
      kindOf(
        '<defs><linearGradient id="a"><stop offset="0" stop-color="#f00"/><stop offset="1" stop-color="#00f"/></linearGradient><linearGradient id="b" xlink:href="#a"/></defs><rect width="24" height="24" fill="url(#b)"/>',
      ),
    ).toBe('multicolor');
  });

  it('uses the fallback color of a missing reference', () => {
    expect(kindOf('<path fill="url(#nope) #f00" d="M0 0h10v10z"/>')).toBe(
      'mono',
    );
  });
});

describe('flags', () => {
  it('a pattern forces multicolor', () => {
    const result = classify(
      svg(
        '<defs><pattern id="p" width="4" height="4" patternUnits="userSpaceOnUse"><path fill="#000" d="M0 0h2v2z"/></pattern></defs><rect width="24" height="24" fill="url(#p)"/>',
      ),
    );
    expect(result.kind).toBe('multicolor');
    expect(result.flags).toEqual(['pattern']);
  });

  it('an <image> forces multicolor', () => {
    const result = classify(
      svg('<image width="24" height="24" href="data:image/png;base64,AAAA"/>'),
    );
    expect(result.kind).toBe('multicolor');
    expect(result.flags).toEqual(['image']);
  });

  it('a foreignObject forces multicolor', () => {
    expect(
      kindOf(
        '<foreignObject width="24" height="24"><div xmlns="http://www.w3.org/1999/xhtml"/></foreignObject>',
      ),
    ).toBe('multicolor');
  });
});

describe('filters, masks and clip paths', () => {
  it('counts a flood color', () => {
    expect(
      kindOf(
        '<defs><filter id="f"><feFlood flood-color="#f00"/></filter></defs><path fill="#00f" filter="url(#f)" d="M0 0h10v10z"/>',
      ),
    ).toBe('multicolor');
  });

  it('ignores a flood with zero opacity', () => {
    expect(
      kindOf(
        '<defs><filter id="f"><feFlood flood-color="#f00" flood-opacity="0"/></filter></defs><path fill="#00f" filter="url(#f)" d="M0 0h10v10z"/>',
      ),
    ).toBe('mono');
  });

  it('feImage forces multicolor', () => {
    expect(
      kindOf(
        '<defs><filter id="f"><feImage href="data:image/png;base64,AAAA"/></filter></defs><path fill="#00f" filter="url(#f)" d="M0 0h10v10z"/>',
      ),
    ).toBe('multicolor');
  });

  it('does not count paint inside a clipPath or a mask', () => {
    expect(
      kindOf(
        '<defs><clipPath id="c"><path fill="#f00" d="M0 0h24v12H0z"/></clipPath><mask id="m"><rect width="24" height="24" fill="#fff"/><circle cx="12" cy="12" r="5" fill="#000"/></mask></defs><path fill="#00f" clip-path="url(#c)" mask="url(#m)" d="M0 0h24v24H0z"/>',
      ),
    ).toBe('mono');
  });
});

describe('fixtures', () => {
  it.each([
    ['mono-fill/heroicons-home.svg', 'mono'],
    ['mono-fill/simple-icons-github.svg', 'mono'],
    ['mono-fill/phosphor-house-duotone-opacity.svg', 'mono'],
    ['mono-fill/figma-export.svg', 'mono'],
    ['stroke/lucide-house.svg', 'mono'],
    ['stroke/tabler-home.svg', 'mono'],
    ['stroke/figma-export.svg', 'mono'],
    ['mixed-fill-stroke/badge.svg', 'mono'],
    ['mixed-fill-stroke/two-tone.svg', 'multicolor'],
    ['multicolor/flat-color-about.svg', 'multicolor'],
    ['multicolor/flag-es.svg', 'multicolor'],
    ['gradient/logos-kotlin.svg', 'multicolor'],
    ['gradient/logos-scaledrone-transparent-stop.svg', 'multicolor'],
    ['mask/knockout.svg', 'mono'],
    ['style/illustrator-mono.svg', 'mono'],
    ['style/illustrator-multicolor.svg', 'multicolor'],
    ['viewbox-derived/no-viewbox.svg', 'mono'],
    ['non-ascii/café.svg', 'mono'],
    ['nested-svg/nested.svg', 'mono'],
  ])('%s is %s', (file, kind) => {
    expect(classify(fixture(file)).kind).toBe(kind);
  });

  it('the implicit-black simple-icons fixture relies on the default fill', () => {
    expect(
      classify(fixture('mono-fill/simple-icons-github.svg')).usesDefaultFill,
    ).toBe(true);
  });
});

describe('edge cases (ADR-0013)', () => {
  const marker = (fill: string): string =>
    `<defs><marker id="m" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0 0L6 3 0 6z" fill="${fill}"/></marker></defs><path d="M3 12h13" fill="none" stroke="#333" stroke-width="2" marker-end="url(#m)"/>`;

  it('counts marker content, from the root state', () => {
    expect(kindOf(marker('#333'))).toBe('mono');
    expect(kindOf(marker('#c00'))).toBe('multicolor');
    // A marker that relies on the default fill paints black, not the stroke color.
    expect(kindOf(marker('').replace(' fill=""', ''))).toBe('multicolor');
    expect(classify(fixture('markers/arrow-mono.svg')).kind).toBe('mono');
    expect(classify(fixture('markers/arrow-two-tone.svg')).kind).toBe(
      'multicolor',
    );
  });

  it('flags a CSS variable paint as themed already (multicolor, never rewritten)', () => {
    const result = classify(
      svg('<path fill="var(--icon, #1e1e1e)" d="M0 0h10v10z"/>'),
    );
    expect(result.kind).toBe('multicolor');
    expect(result.flags).toEqual(['variable']);
    expect(
      kindOf(
        '<g color="var(--c)"><path fill="currentColor" d="M0 0h10v10z"/></g>',
      ),
    ).toBe('multicolor');
    expect(classify(fixture('css-variables/themed-fill.svg')).flags).toEqual([
      'variable',
    ]);
  });

  it('flags a SMIL animation of a paint property, not of a transform', () => {
    expect(
      classify(
        svg(
          '<circle cx="12" cy="12" r="8" fill="#333"><animate attributeName="fill" values="#333;#c00;#333" dur="1s"/></circle>',
        ),
      ),
    ).toMatchObject({ kind: 'multicolor', flags: ['animation'] });
    expect(
      kindOf(
        '<path fill="#333" d="M0 0h10v10z"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="1s"/></path>',
      ),
    ).toBe('mono');
    expect(
      kindOf(
        '<path fill="#333" d="M0 0h10v10z"><set attributeName="stroke" to="#c00"/></path>',
      ),
    ).toBe('multicolor');
    expect(classify(fixture('animation/pulse-fill.svg')).kind).toBe(
      'multicolor',
    );
    expect(classify(fixture('animation/spin.svg')).kind).toBe('mono');
  });
});
