import { optimize, type CustomPlugin } from 'svgo';
import { describe, expect, it, vi } from 'vitest';

import type * as classifyModule from './color/classify.ts';
import type * as optimizeModule from './optimize.ts';

import { ColorMode } from '../config/schema.ts';
import { DiagnosticCode } from '../errors.ts';
import { classifyIcon } from './color/classify.ts';
import { transformIcon } from './transform.ts';

// Nothing in the fixtures makes a style or optimize plugin throw, so a test plugin at the end
// of each list throws on demand.
const { throwIn, throwingPlugin } = vi.hoisted(() => {
  const state = { stage: undefined as string | undefined };
  return {
    throwIn: state,
    throwingPlugin: (stage: string): CustomPlugin => ({
      name: `test-throw-${stage}`,
      fn: () => {
        if (state.stage === stage) {
          state.stage = undefined;
          throw new Error('Unexpected token in CSS');
        }
        return null;
      },
    }),
  };
});

vi.mock('./color/classify.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof classifyModule>();
  return { ...actual, classifyIcon: vi.fn(actual.classifyIcon) };
});
vi.mock('./optimize.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof optimizeModule>();
  return {
    ...actual,
    STYLE_PLUGINS: [...actual.STYLE_PLUGINS, throwingPlugin('style')],
    OPTIMIZE_PLUGINS: [...actual.OPTIMIZE_PLUGINS, throwingPlugin('optimize')],
  };
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
    vi.mocked(classifyIcon).mockImplementationOnce(() => {
      throw new Error('classify broke');
    });
    expect(() => transformIcon(input)).toThrow('classify broke');
  });

  it('reports an svgo failure on the input as a diagnostic on the file', () => {
    throwIn.stage = 'style';
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

describe('transformIcon: one svgo run, same error precedence (TSK-096)', () => {
  const NS = 'xmlns="http://www.w3.org/2000/svg"';
  const MEDIA = '<style>@media (min-width:1px){path{fill:red}}</style>';
  const codesOf = (markup: string, stage?: string) => {
    throwIn.stage = stage;
    const result = transformIcon({
      ...input,
      content: new TextEncoder().encode(markup),
    });
    throwIn.stage = undefined;
    return result.ok ? [] : result.errors.map((error) => error.code);
  };

  it('pins that svgo lets a plugin throw leave optimize as is, unwrapped', () => {
    const sentinel = new Error('stop');
    const plugin: CustomPlugin = {
      name: 'throw-sentinel',
      fn: () => {
        throw sentinel;
      },
    };
    let caught: unknown;
    try {
      optimize(`<svg ${NS}/>`, { plugins: [plugin, 'preset-default'] });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBe(sentinel);
  });

  it('reports a parse error first, with its line and column', () => {
    const result = transformIcon({
      ...input,
      content: new TextEncoder().encode(`<svg ${NS}><script>`),
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((error) => error.code)).toEqual([
      DiagnosticCode.INVALID_XML,
    ]);
    expect(result.errors[0]?.message).toMatch(/^line \d+, column \d+: /);
  });

  it('reports validation before the viewBox, styles and svgo', () => {
    expect(codesOf(`<svg ${NS}>${MEDIA}<script/></svg>`, 'style')).toEqual([
      DiagnosticCode.FORBIDDEN_ELEMENT,
    ]);
  });

  it('reports the viewBox before styles and svgo', () => {
    expect(
      codesOf(`<svg ${NS}>${MEDIA}<path d="M0 0"/></svg>`, 'style'),
    ).toEqual([DiagnosticCode.MISSING_VIEWBOX]);
  });

  it('reports a style plugin failure before leftover styles', () => {
    expect(
      codesOf(
        `<svg ${NS} viewBox="0 0 24 24">${MEDIA}<path d="M0 0"/></svg>`,
        'style',
      ),
    ).toEqual([DiagnosticCode.INVALID_XML]);
  });

  it('reports leftover styles before an optimize plugin failure', () => {
    expect(
      codesOf(
        `<svg ${NS} viewBox="0 0 24 24">${MEDIA}<path d="M0 0"/></svg>`,
        'optimize',
      ),
    ).toEqual([DiagnosticCode.UNSCOPABLE_STYLE]);
  });

  it('reports an optimize plugin failure as svgo failing on the file', () => {
    const result = (() => {
      throwIn.stage = 'optimize';
      return transformIcon(input);
    })();
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]?.message).toBe(
      'svgo could not process the file: Unexpected token in CSS',
    );
  });
});
