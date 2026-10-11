import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { optimizeMarkup, normalizeStyles } from './optimize.ts';
import { dropNoopClips, hasUrlReferences, toDelivery } from './references.ts';
import { mutateSvgTree } from './tree.ts';

const fixture = (name: string): string =>
  readFileSync(
    new URL(`../../../../../fixtures/${name}`, import.meta.url),
    'utf8',
  );

const svg = (body: string, attributes = ''): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"${attributes}>${body}</svg>`;

const analyze = (text: string, viewBox = '0 0 24 24') =>
  mutateSvgTree(optimizeMarkup(normalizeStyles(text)), (root) => {
    dropNoopClips(root, viewBox);
    return hasUrlReferences(root);
  });

describe('hasUrlReferences', () => {
  it.each([
    [
      'fill',
      '<defs><linearGradient id="g"/></defs><rect fill="url(#g)" width="1" height="1"/>',
    ],
    [
      'stroke',
      '<defs><linearGradient id="g"/></defs><rect stroke="url(#g)" width="1" height="1"/>',
    ],
    [
      'clip-path',
      '<defs><clipPath id="c"><circle r="5"/></clipPath></defs><rect clip-path="url(#c)" width="9" height="9"/>',
    ],
    [
      'mask',
      '<defs><mask id="m"><circle r="5" fill="#fff"/></mask></defs><rect mask="url(#m)" width="9" height="9"/>',
    ],
    [
      'filter',
      '<defs><filter id="f"><feOffset dx="1"/></filter></defs><rect filter="url(#f)" width="9" height="9"/>',
    ],
    [
      'marker',
      '<defs><marker id="k"><path d="M0 0"/></marker></defs><path marker-end="url(#k)" d="M0 0l9 9"/>',
    ],
  ])('is true for %s', (_label, body) => {
    expect(analyze(svg(body)).result).toBe(true);
  });

  it('is false for an internal <use> alone', () => {
    expect(
      analyze(
        svg(
          '<defs><path id="p" d="M0 0h9v9z"/></defs><use href="#p"/><use href="#p" x="10"/>',
        ),
      ).result,
    ).toBe(false);
  });

  it('is false for plain shapes', () => {
    expect(analyze(svg('<path d="M0 0h9v9z"/>')).result).toBe(false);
  });
});

describe('dropNoopClips', () => {
  it('drops a Figma clip rect that covers the whole viewBox', () => {
    const { data, result } = analyze(fixture('mono-fill/figma-export.svg'));
    expect(result).toBe(false);
    expect(data).not.toMatch(/clip/i);
  });

  it('drops a full-viewBox clip written as a path', () => {
    const { data, result } = analyze(fixture('stroke/figma-export.svg'));
    expect(result).toBe(false);
    expect(data).not.toMatch(/clip/i);
  });

  it('keeps a clip that covers only part of the viewBox', () => {
    const text = fixture('clip-path/fluent-paperclip.svg');
    expect(analyze(text, '0 0 32 32').result).toBe(false);
    const partial = analyze(
      svg(
        '<defs><clipPath id="c"><rect width="24" height="14"/></clipPath></defs><circle cx="12" cy="12" r="10" clip-path="url(#c)"/>',
      ),
    );
    expect(partial.result).toBe(true);
    expect(partial.data).toContain('clip-path');
  });

  it('accepts a clip larger than the viewBox', () => {
    const { result } = analyze(
      svg(
        '<defs><clipPath id="c"><rect x="-5" y="-5" width="40" height="40"/></clipPath></defs><circle cx="12" cy="12" r="10" clip-path="url(#c)"/>',
      ),
    );
    expect(result).toBe(false);
  });

  it('keeps the clip when the clipped element is transformed', () => {
    const { result } = analyze(
      svg(
        '<defs><clipPath id="c"><rect width="24" height="24"/></clipPath></defs><g transform="translate(5 0)" clip-path="url(#c)"><circle cx="12" cy="12" r="10"/></g>',
      ),
    );
    expect(result).toBe(true);
  });

  it('keeps the clip when an ancestor is transformed', () => {
    const { result } = analyze(
      svg(
        '<defs><clipPath id="c"><rect width="24" height="24"/></clipPath></defs><g transform="scale(2)"><g clip-path="url(#c)"><circle cx="5" cy="5" r="4"/></g></g>',
      ),
    );
    expect(result).toBe(true);
  });

  it('keeps a clipPath that uses objectBoundingBox units', () => {
    const { result } = analyze(
      svg(
        '<defs><clipPath id="c" clipPathUnits="objectBoundingBox"><rect width="1" height="1"/></clipPath></defs><circle cx="12" cy="12" r="10" clip-path="url(#c)"/>',
      ),
    );
    expect(result).toBe(true);
  });

  it('keeps a clip with several children', () => {
    const { result } = analyze(
      svg(
        '<defs><clipPath id="c"><rect width="24" height="24"/><circle r="3"/></clipPath></defs><circle cx="12" cy="12" r="10" clip-path="url(#c)"/>',
      ),
    );
    expect(result).toBe(true);
  });

  it('removes the clipPath only when nothing references it any more', () => {
    const { data } = analyze(
      svg(
        '<defs><clipPath id="c"><rect width="24" height="24"/></clipPath></defs><g clip-path="url(#c)"><circle cx="12" cy="12" r="5"/></g><g transform="scale(2)" clip-path="url(#c)"><circle cx="5" cy="5" r="2"/></g>',
      ),
    );
    expect(data).toContain('<clipPath');
    expect(data.match(/clip-path=/g)).toHaveLength(1);
  });
});

describe('toDelivery', () => {
  it.each([
    ['mono', false, 'use'],
    ['multicolor', false, 'use'],
    ['mono', true, 'mask'],
    ['multicolor', true, 'img'],
  ] as const)(
    '%s with references=%s is %s',
    (color, hasReferences, delivery) => {
      expect(toDelivery(color, hasReferences)).toBe(delivery);
    },
  );
});
