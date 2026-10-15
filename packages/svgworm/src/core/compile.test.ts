import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import type { BuildEvent } from './events.ts';

import {
  compile,
  type CompileOptions,
  type CompileResult,
  type SourceInput,
} from './compile.ts';
import { DiagnosticCode } from './errors.ts';
import { readSources, shuffle } from './fixture-sources.test-helper.ts';

const options: CompileOptions = {
  flatten: false,
  publicPath: '/icons',
  color: [],
};
const encode = (text: string): Uint8Array => new TextEncoder().encode(text);
const svg = (body = '<path d="M0 0h24v24H0z"/>'): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${body}</svg>`;
const source = (path: string, content: string = svg()): SourceInput => ({
  path: `icons/${path}`,
  relativePath: path,
  content: encode(content),
});

const snapshotDir = fileURLToPath(
  new URL('./__snapshots__/fixtures/', import.meta.url),
);
const unscopable = 'style/unscopable-media.svg';

const corpus = readSources('fixtures').filter(
  (item) =>
    !item.relativePath.startsWith('invalid/') &&
    item.relativePath !== unscopable,
);
const invalid = readSources('fixtures').filter(
  (item) =>
    item.relativePath.startsWith('invalid/') ||
    item.relativePath === unscopable,
);

const success = (result: CompileResult) => {
  if (!result.ok) throw new Error(JSON.stringify(result.errors));
  return result;
};

// File names carry content hashes, so snapshots are keyed by role instead.
const snapshotName = (name: string): string =>
  name.startsWith('icons.stack.')
    ? 'stack.svg'
    : name.startsWith('icons.') && name.endsWith('.svg')
      ? 'sprite.svg'
      : name;

const withoutTiming = (result: CompileResult): unknown =>
  result.ok ? { ...result, stats: { ...result.stats, durationMs: 0 } } : result;

describe('compile: license comments', () => {
  const lucide = (d: string) =>
    new TextEncoder().encode(
      `<!-- @license lucide-static v1.52.0 - ISC -->\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${d}"/></svg>`,
    );

  it('puts the licenses of the icons in a file once at the top of that file', () => {
    const result = compile(
      [
        {
          path: 'icons/a.svg',
          relativePath: 'a.svg',
          content: lucide('M0 0h1'),
        },
        {
          path: 'icons/b.svg',
          relativePath: 'b.svg',
          content: lucide('M0 0h2'),
        },
        {
          path: 'icons/c.svg',
          relativePath: 'c.svg',
          content: new TextEncoder().encode(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h3"/></svg>',
          ),
        },
      ],
      { flatten: false, color: [], publicPath: '/icons' },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const sprite = result.files.find((file) => file.name.startsWith('icons.'));
    expect(sprite?.content.split('@license')).toHaveLength(2);
    expect(
      sprite?.content.startsWith(
        '<!-- @license lucide-static v1.52.0 - ISC -->\n<svg',
      ),
    ).toBe(true);
  });
});

describe('compile: fixture corpus', () => {
  const result = success(compile(corpus, options));

  it.each(result.files.map((file) => [snapshotName(file.name), file] as const))(
    'emits %s',
    async (name, file) => {
      await expect(file.content).toMatchFileSnapshot(`${snapshotDir}${name}`);
    },
  );

  it('lists name, color and delivery of every icon', async () => {
    const table = result.icons.map(({ name, color, delivery }) => ({
      name,
      color,
      delivery,
    }));
    await expect(`${JSON.stringify(table, null, 2)}\n`).toMatchFileSnapshot(
      `${snapshotDir}icons.json`,
    );
  });

  it('counts icons, colors and deliveries', () => {
    const { stats } = result;
    expect(stats.icons).toBe(corpus.length);
    expect(stats.mono + stats.multicolor).toBe(stats.icons);
    const { use, img, mask } = stats.delivery;
    expect(use + img + mask).toBe(stats.icons);
    expect(stats.sourceBytes - stats.spriteBytes - stats.stackBytes).toBe(
      stats.savingsBytes,
    );
    expect(stats.durationMs).toBeGreaterThan(0);
  });

  it('warns about the derived viewBox', () => {
    expect(result.warnings.map((item) => [item.code, item.file])).toEqual([
      [
        DiagnosticCode.VIEWBOX_DERIVED,
        'fixtures/viewbox-derived/no-viewbox.svg',
      ],
    ]);
  });
});

describe('compile: invalid input', () => {
  it('collects every error of every invalid fixture and returns no files', async () => {
    const result = compile(invalid, options);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result).not.toHaveProperty('files');
    const lines = result.errors.map(
      (item) => `${item.file}\t${item.code}\t${item.message}`,
    );
    await expect(`${lines.join('\n')}\n`).toMatchFileSnapshot(
      `${snapshotDir}invalid-errors.txt`,
    );
  });

  it.each(invalid.map((item) => [item.relativePath, item] as const))(
    'rejects %s on its own',
    (_name, item) => {
      const result = compile([item], options);
      expect(result.ok).toBe(false);
      if (!result.ok)
        expect(result.errors.every((error) => error.file === item.path)).toBe(
          true,
        );
    },
  );

  it('reports collisions and invalid SVGs together (R-04)', () => {
    const result = compile(
      [
        source('a/close.svg'),
        source('b/close.svg'),
        source('broken.svg', '<svg'),
        source('🔥.svg'),
      ],
      { ...options, flatten: true },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((error) => error.code).toSorted()).toEqual(
      [
        DiagnosticCode.EMPTY_NAME,
        DiagnosticCode.NOT_SVG_ROOT,
        DiagnosticCode.NAME_COLLISION,
      ].toSorted(),
    );
  });

  it('fails with one error when there are no icons', () => {
    const result = compile([], options);
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.errors.map((error) => error.code)).toEqual([
        DiagnosticCode.NO_ICONS,
      ]);
  });
});

describe('compile: determinism', () => {
  const comparable = (sources: readonly SourceInput[]) => {
    const result = success(compile(sources, options));
    return {
      files: result.files,
      manifest: result.manifest,
      stats: { ...result.stats, durationMs: 0 },
    };
  };
  const baseline = comparable(corpus);

  it.each([1, 2, 3, 4, 5, 6, 7, 8])(
    'gives the same output for shuffle %i',
    (seed) => {
      expect(comparable(shuffle(corpus, seed))).toEqual(baseline);
    },
  );

  it('gives the same output for reversed input', () => {
    expect(comparable(corpus.toReversed())).toEqual(baseline);
  });

  it('gives the same output for NFC and NFD names', () => {
    const nfd = corpus.map((item) => ({
      ...item,
      path: item.path.normalize('NFD'),
      relativePath: item.relativePath.normalize('NFD'),
    }));
    expect(comparable(nfd)).toEqual(baseline);
    expect(nfd.some((item, index) => item.path !== corpus[index]?.path)).toBe(
      true,
    );
  });

  it('gives the same output for backslash paths', () => {
    const windows = corpus.map((item) => ({
      ...item,
      path: item.path.replaceAll('/', '\\'),
      relativePath: item.relativePath.replaceAll('/', '\\'),
    }));
    expect(comparable(windows)).toEqual(baseline);
  });

  it('reports one collision for the NFC and NFD forms of one name', () => {
    const result = compile(
      [source('café.svg'), source('café'.normalize('NFD') + '.svg')],
      options,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((error) => error.code)).toEqual([
      DiagnosticCode.NAME_COLLISION,
    ]);
    expect(result.errors[0]?.message).toContain('café.svg');
  });

  it('keeps errors in the same order for shuffled input', () => {
    const run = (sources: readonly SourceInput[]) =>
      withoutTiming(compile(sources, options));
    expect(run(shuffle(invalid, 3))).toEqual(run(invalid));
  });
});

describe('compile: events', () => {
  it('reports start, one event per icon, and warnings', () => {
    const events: BuildEvent[] = [];
    success(compile(corpus, options, (event) => events.push(event)));
    expect(events[0]).toEqual({ type: 'start', total: corpus.length });
    expect(events.filter((event) => event.type === 'icon')).toHaveLength(
      corpus.length,
    );
    expect(events.filter((event) => event.type === 'warning')).toHaveLength(1);
  });

  it('applies color overrides by public name', () => {
    const rules = [{ match: 'ui/*', color: 'preserve' as const }];
    const result = success(
      compile(
        [source('ui/check.svg', svg('<path fill="#000" d="M0 0h1v1z"/>'))],
        {
          ...options,
          color: rules,
        },
      ),
    );
    expect(result.icons.map((icon) => icon.color)).toEqual(['multicolor']);
  });
});
