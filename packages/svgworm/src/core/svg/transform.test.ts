import { describe, expect, it, vi } from 'vitest';

import type * as optimizeModule from './optimize.ts';
import type * as treeModule from './tree.ts';

import { ColorMode } from '../config/schema.ts';
import { DiagnosticCode } from '../errors.ts';
import { normalizeStyles } from './optimize.ts';
import { transformIcon } from './transform.ts';
import { mutateSvgTree } from './tree.ts';

vi.mock('./tree.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof treeModule>();
  return { ...actual, mutateSvgTree: vi.fn(actual.mutateSvgTree) };
});
vi.mock('./optimize.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof optimizeModule>();
  return { ...actual, normalizeStyles: vi.fn(actual.normalizeStyles) };
});

const input = {
  content: new TextEncoder().encode(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>',
  ),
  file: 'icons/home.svg',
  symbolId: 'home',
  mode: ColorMode.AUTO,
};

describe('transformIcon: license comments (TSK-066)', () => {
  const icon = (markup: string) =>
    transformIcon({
      ...input,
      content: new TextEncoder().encode(markup),
    });

  it('keeps @license and /*! style comments, trimmed, sorted and unique', () => {
    const result = icon(
      '<!-- @license lucide-static v1.52.0 - ISC -->\n' +
        '<!-- a note that is not a license -->\n' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
        '<!--! Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc. -->' +
        '<!--   @license lucide-static v1.52.0 - ISC   -->' +
        '<path d="M0 0h24v24H0z"/></svg>',
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.icon.licenses).toEqual([
      '! Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.',
      '@license lucide-static v1.52.0 - ISC',
    ]);
    expect(result.icon.inner).not.toContain('<!--');
  });

  it('has no licenses for a file without such comments', () => {
    const result = icon(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><!-- plain --><path d="M0 0h24v24H0z"/></svg>',
    );
    expect(result.ok && result.icon.licenses).toEqual([]);
  });
});

describe('transformIcon: failure boundaries (RPT-001)', () => {
  it('transforms a valid icon', () => {
    expect(transformIcon(input).ok).toBe(true);
  });

  it('throws on an internal failure instead of blaming the icon', () => {
    vi.mocked(mutateSvgTree).mockImplementationOnce(() => {
      throw new Error('svgo did not run the transform');
    });
    expect(() => transformIcon(input)).toThrow(
      'svgo did not run the transform',
    );
  });

  it('reports an svgo failure on the input as a diagnostic on the file', () => {
    vi.mocked(normalizeStyles).mockImplementationOnce(() => {
      throw new Error('Unexpected token in CSS');
    });
    const result = transformIcon(input);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual([
      {
        code: DiagnosticCode.INVALID_XML,
        file: 'icons/home.svg',
        message: 'svgo could not process the file: Unexpected token in CSS',
      },
    ]);
  });
});
