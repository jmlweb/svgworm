import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { BuildEvent } from './events.ts';

import { build } from './build.ts';
import { check, CheckStatus } from './check.ts';
import { resolveConfig, type ResolvedConfig } from './config/resolve.ts';
import { DiagnosticCode } from './errors.ts';

let root = '';

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'svgworm-check-'));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>';

const put = async (relative: string, content = svg): Promise<void> => {
  const path = join(root, relative);
  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(path, content);
};

const config = (): ResolvedConfig =>
  resolveConfig({ sources: ['icons'] }, root);

const hashless = (path: string): string =>
  path.replace(/\.[0-9a-f]{8}\./, '.H.');

describe('check', () => {
  it('reports every file as missing before the first build', async () => {
    await put('icons/home.svg');
    const result = await check(config());
    if (!result.ok) throw new Error(JSON.stringify(result.errors));
    expect(result.upToDate).toBe(false);
    expect(
      result.stale.map((entry) => [hashless(entry.path), entry.status]),
    ).toEqual([
      ['public/icons/icons.H.svg', CheckStatus.MISSING],
      ['svgworm/icons.js', CheckStatus.MISSING],
      ['svgworm/icons.d.ts', CheckStatus.MISSING],
      ['svgworm/manifest.json', CheckStatus.MISSING],
    ]);
    expect(result.iconDiff).toEqual({ added: ['home'], removed: [] });
  });

  it('is up to date right after a build and writes nothing', async () => {
    await put('icons/home.svg');
    await build(config());
    const events: BuildEvent[] = [];
    const result = await check(config(), (event) => events.push(event));
    if (!result.ok) throw new Error(JSON.stringify(result.errors));
    expect(result.upToDate).toBe(true);
    expect(result.stale).toEqual([]);
    expect(result.iconDiff).toEqual({ added: [], removed: [] });
    expect(events.map((event) => event.type)).not.toContain('write');
    expect(events.at(-1)?.type).toBe('done');
  });

  it('reports a changed module, a missing sprite and a stale sprite after icons change', async () => {
    await put('icons/home.svg');
    await put('icons/old.svg', svg.replace('M0 0', 'M2 2'));
    await build(config());
    await rm(join(root, 'icons/old.svg'));
    await put('icons/new.svg', svg.replace('M0 0', 'M1 1'));
    const result = await check(config());
    if (!result.ok) throw new Error(JSON.stringify(result.errors));
    expect(result.upToDate).toBe(false);
    expect(
      result.stale.map((entry) => [hashless(entry.path), entry.status]),
    ).toEqual([
      ['public/icons/icons.H.svg', CheckStatus.MISSING],
      ['svgworm/icons.js', CheckStatus.CHANGED],
      ['svgworm/icons.d.ts', CheckStatus.CHANGED],
      ['svgworm/manifest.json', CheckStatus.CHANGED],
      ['public/icons/icons.H.svg', CheckStatus.STALE],
    ]);
    expect(result.iconDiff).toEqual({ added: ['new'], removed: ['old'] });
  });

  it('ignores foreign files in outDir and an unreadable manifest', async () => {
    await put('icons/home.svg');
    await build(config());
    await put('public/icons/icons.svg', 'foreign');
    await put('public/icons/readme.txt', 'foreign');
    await put('svgworm/manifest.json', 'not json');
    const result = await check(config());
    if (!result.ok) throw new Error(JSON.stringify(result.errors));
    expect(result.stale.map((entry) => entry.path)).toEqual([
      'svgworm/manifest.json',
    ]);
    expect(result.iconDiff).toEqual({ added: ['home'], removed: [] });
  });

  it('fails like build on invalid input', async () => {
    await put('icons/home.svg');
    await put('icons/broken.svg', '<svg');
    const result = await check(config());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.map((error) => error.code)).toEqual([
        DiagnosticCode.NOT_SVG_ROOT,
      ]);
    }
  });
});
