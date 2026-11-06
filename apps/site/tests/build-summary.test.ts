import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { compileFromDisk, loadConfig } from 'svgworm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { BuildSummary } from '../src/lib/build-summary';

import {
  formatBytes,
  formatSavings,
  readBuildSummary,
  readCacheTime,
} from '../src/lib/build-summary';

// The hero terminal and the stats band print these numbers as the page's own. They are compared
// with what svgworm itself computes from icons/, so a helper that drifts cannot pass.
const root = fileURLToPath(new URL('..', import.meta.url));

let summary: BuildSummary;
let stats: {
  readonly icons: number;
  readonly sourceBytes: number;
  readonly spriteBytes: number;
  readonly stackBytes: number;
  readonly savingsBytes: number;
};
let previousCwd: string;

beforeAll(async () => {
  // Same as the worked example: the helper reads from the site root.
  previousCwd = process.cwd();
  process.chdir(root);
  summary = readBuildSummary();
  const result = await compileFromDisk(await loadConfig({ cwd: root }));
  if (!result.ok) throw new Error('the site icons must compile');
  ({ stats } = result);
});

afterAll(() => {
  process.chdir(previousCwd);
});

describe('the build summary', () => {
  it('matches the stats svgworm computes', () => {
    expect(summary.sourceFiles).toBe(stats.icons);
    expect(summary.bytes).toEqual({
      source: stats.sourceBytes,
      sprite: stats.spriteBytes,
      stack: stats.stackBytes,
    });
    expect(summary.source).toBe(formatBytes(stats.sourceBytes));
    expect(summary.sprite).toBe(formatBytes(stats.spriteBytes));
    expect(summary.stack).toBe(formatBytes(stats.stackBytes));
    expect(summary.output).toBe(
      formatBytes(stats.spriteBytes + stats.stackBytes),
    );
    expect(summary.savings).toBe(
      formatSavings(stats.savingsBytes, stats.sourceBytes),
    );
  });

  it('counts the two icon files', () => {
    expect(summary.iconFiles).toBe(2);
  });

  it('lists the generated files with their sizes, in the order the CLI writes them', async () => {
    const paths = summary.writes.map(({ path }) => path);
    expect(paths.slice(2)).toEqual([
      'svgworm/icons.js',
      'svgworm/icons.d.ts',
      'svgworm/manifest.json',
    ]);
    expect(paths[0]).toMatch(/^public\/icons\/icons\.[0-9a-f]{8}\.svg$/);
    expect(paths[1]).toMatch(/^public\/icons\/icons\.stack\.[0-9a-f]{8}\.svg$/);
    const sizes = await Promise.all(
      paths.map(async (path) =>
        formatBytes((await stat(join(root, path))).size),
      ),
    );
    expect(summary.writes.map(({ size }) => size)).toEqual(sizes);
  });

  it('reads the cache time from the real _headers', () => {
    expect(summary.cache).toBe('1 year');
  });
});

describe('formatBytes', () => {
  it('formats like the CLI reporter', () => {
    expect(formatBytes(1023)).toBe('1023 B');
    expect(formatBytes(1024)).toBe('1.0 KiB');
    expect(formatBytes(-130)).toBe('-130 B');
  });
});

describe('formatSavings', () => {
  it('adds the percentage of the source', () => {
    expect(formatSavings(512, 2048)).toBe('512 B (25.0%)');
  });

  it('has no percentage for an empty source folder', () => {
    expect(formatSavings(0, 0)).toBe('0 B');
  });
});

describe('readCacheTime', () => {
  it('reads only the /icons/* block', () => {
    const headers = [
      '/icons/*',
      '  X-Content-Type-Options: nosniff',
      '',
      '/fonts/*',
      '  Cache-Control: public, max-age=31536000',
    ].join('\n');
    expect(() => readCacheTime(headers)).toThrow('no max-age');
  });

  it('pluralizes', () => {
    expect(readCacheTime('/icons/*\n  Cache-Control: max-age=63072000\n')).toBe(
      '2 years',
    );
  });
});
