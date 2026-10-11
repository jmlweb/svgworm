import { describe, expect, it } from 'vitest';

import { optimizeMarkup, normalizeStyles } from '../optimize.ts';
import { prepareTree } from '../prepare.ts';
import { mutateSvgTree } from '../tree.ts';
import { classifyIcon } from './classify.ts';
import { rewriteToCurrentColor } from './rewrite.ts';

const svg = (body: string, attributes = ''): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"${attributes}>${body}</svg>`;

const rewrite = (text: string): string =>
  mutateSvgTree(optimizeMarkup(normalizeStyles(text)), (root) => {
    rewriteToCurrentColor(root, classifyIcon(root));
  }).data;

describe('rewriteToCurrentColor', () => {
  it('replaces the paint on the element that declares it, not on the root', () => {
    const output = rewrite(svg('<path fill="#123456" d="M0 0h10v10z"/>'));
    expect(output).toContain('<path fill="currentColor"');
    expect(output).not.toMatch(/<svg[^>]* fill=/);
  });

  it('rewrites fill and stroke of one color', () => {
    const output = rewrite(
      svg('<path fill="#222" stroke="#222" stroke-width="2" d="M0 0h10v10z"/>'),
    );
    expect(output).toContain('fill="currentColor"');
    expect(output).toContain('stroke="currentColor"');
  });

  it('keeps fill="none" untouched', () => {
    const output = rewrite(
      svg('<path fill="none" stroke="#222" stroke-width="2" d="M0 0l10 10"/>'),
    );
    expect(output).toContain('fill="none"');
    expect(output).toContain('stroke="currentColor"');
  });

  it('puts fill="currentColor" on the root only for the implicit black fill', () => {
    const implicit = rewrite(svg('<path d="M0 0h10v10z"/>'));
    expect(implicit).toMatch(/<svg[^>]* fill="currentColor"/);
    const explicit = rewrite(
      svg('<path fill="#000" d="M0 0h10v10z"/><path d="M12 12h10v10z"/>'),
    );
    expect(explicit).toMatch(
      /<svg[^>]* fill="currentColor"|<path fill="currentColor"/,
    );
  });

  it('freezes the inherited fill of a mask before changing the root (LRN-006)', () => {
    const output = rewrite(
      svg(
        '<defs><mask id="m"><rect width="24" height="24" fill="#fff"/><circle cx="12" cy="12" r="5" fill="#000"/></mask></defs><rect width="24" height="24" mask="url(#m)"/>',
      ),
    );
    expect(output).toMatch(/<mask[^>]* fill="(?:#000|#000000|black)"/);
    expect(output).toMatch(/<svg[^>]* fill="currentColor"/);
    // The mask keeps its own paint.
    expect(output).toContain('fill="#fff"');
  });

  it('does not rewrite clipPath content', () => {
    const output = rewrite(
      svg(
        '<defs><clipPath id="c"><path fill="#f00" d="M0 0h24v12H0z"/></clipPath></defs><path fill="#00f" clip-path="url(#c)" d="M0 0h24v24H0z"/>',
      ),
    );
    expect(output).toMatch(/<clipPath[^>]*><path fill="red"/);
    expect(output).toContain('<path fill="currentColor"');
  });

  it('rewrites the stops of a one-color gradient', () => {
    const output = rewrite(
      svg(
        '<defs><linearGradient id="g"><stop offset="0" stop-color="#222"/><stop offset="1" stop-color="#222" stop-opacity=".2"/></linearGradient></defs><rect width="24" height="24" fill="url(#g)"/>',
      ),
    );
    expect(output.match(/stop-color="currentColor"/g)).toHaveLength(2);
    expect(output).toContain('fill="url(#g)"');
  });

  it('drops the color attribute outside masks and clip paths', () => {
    const output = rewrite(
      svg('<g color="#f00"><path fill="currentColor" d="M0 0h10v10z"/></g>'),
    );
    expect(output).not.toContain('color="#f00"');
  });

  it('flattens a multicolor icon when told to', () => {
    const text = optimizeMarkup(
      svg(
        '<path fill="#f00" d="M0 0h10v10z"/><path fill="#00f" d="M12 12h10v10z"/>',
      ),
    );
    const output = mutateSvgTree(text, (root) => {
      rewriteToCurrentColor(root, classifyIcon(root));
    }).data;
    expect(output.match(/fill="currentColor"/g)).toHaveLength(2);
  });

  it('is a no-op for an icon that already follows currentColor', () => {
    const text = optimizeMarkup(
      svg('<path fill="currentColor" d="M0 0h10v10z"/>'),
    );
    const output = mutateSvgTree(text, (root) => {
      rewriteToCurrentColor(root, classifyIcon(root));
    }).data;
    expect(output).toBe(text);
  });

  it('classifies identically after the rewrite', () => {
    const parsed = prepareTree(svg('<path fill="#123" d="M0 0h10v10z"/>'));
    if (!parsed.ok) throw new Error(parsed.message);
    rewriteToCurrentColor(parsed.root, classifyIcon(parsed.root));
    expect(classifyIcon(parsed.root).colors).toEqual(['currentColor']);
  });
});
