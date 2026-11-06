import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { BuildSummary } from '../src/lib/build-summary';

import { readBuildSummary } from '../src/lib/build-summary';

// The hero terminal and the stats band print these numbers as the page's own, so they must match
// the committed files. The test measures them on its own.
const root = fileURLToPath(new URL('..', import.meta.url));

type Manifest = {
  readonly sprites: Record<
    string,
    {
      readonly sprite: { readonly url: string } | null;
      readonly stack: { readonly url: string } | null;
    }
  >;
};

const kib = (bytes: number) => `${(bytes / 1024).toFixed(1)} KiB`;

let summary: BuildSummary;
let spriteBytes: number;
let stackBytes: number;
let previousCwd: string;

beforeAll(async () => {
  // Same as the worked example: the helper reads from the site root.
  previousCwd = process.cwd();
  process.chdir(root);
  summary = readBuildSummary();
  const { icons } = (
    JSON.parse(
      await readFile(join(root, 'svgworm/manifest.json'), 'utf8'),
    ) as Manifest
  ).sprites;
  const sizeOf = async (url = '') =>
    (await stat(join(root, 'public', url))).size;
  spriteBytes = await sizeOf(icons?.sprite?.url);
  stackBytes = await sizeOf(icons?.stack?.url);
});

afterAll(() => {
  process.chdir(previousCwd);
});

describe('the build summary', () => {
  it('reports the real sprite and stack sizes', () => {
    expect(summary.sprite).toBe(kib(spriteBytes));
    expect(summary.stack).toBe(kib(stackBytes));
    expect(summary.output).toBe(kib(spriteBytes + stackBytes));
  });

  it('counts the two icon files', () => {
    expect(summary.iconFiles).toBe(2);
  });

  it('lists the generated files in the order the CLI writes them', () => {
    const paths = summary.writes.map(({ path }) => path);
    expect(paths.slice(2)).toEqual([
      'svgworm/icons.js',
      'svgworm/icons.d.ts',
      'svgworm/manifest.json',
    ]);
    expect(paths[0]).toMatch(/^public\/icons\/icons\.[0-9a-f]{8}\.svg$/);
    expect(paths[1]).toMatch(/^public\/icons\/icons\.stack\.[0-9a-f]{8}\.svg$/);
  });

  it('reads the cache time from _headers', () => {
    expect(summary.cacheYears).toBe(1);
  });
});
