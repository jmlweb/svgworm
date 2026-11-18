import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { BuildResult } from './build.ts';

import { build } from './build.ts';
import { check } from './check.ts';
import { resolveConfig, type ResolvedConfig } from './config/resolve.ts';
import { watch, type WatcherFactory } from './watch.ts';

// Absolute sources, outDir and moduleDir are used as given, never mirrored under cwd (RPT-015).

let base = '';
let cwd = '';
let sourceDir = '';
let outDir = '';
let moduleDir = '';

beforeEach(async () => {
  base = await mkdtemp(join(tmpdir(), 'svgworm-absolute-'));
  cwd = join(base, 'project');
  sourceDir = join(base, 'elsewhere', 'icons');
  outDir = join(base, 'elsewhere', 'sprites');
  moduleDir = join(base, 'elsewhere', 'generated');
  await mkdir(cwd, { recursive: true });
  await mkdir(sourceDir, { recursive: true });
  await writeFile(
    join(sourceDir, 'home.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>',
  );
});
afterEach(async () => {
  await rm(base, { recursive: true, force: true, maxRetries: 5 });
});

const absoluteConfig = (): ResolvedConfig =>
  resolveConfig(
    { sources: [sourceDir], outDir, publicPath: '/sprites', moduleDir },
    cwd,
  );

/** The path from cwd with `/` separators, as results report it. */
const reported = (path: string): string =>
  relative(cwd, path).replaceAll('\\', '/');

describe('absolute sources, outDir and moduleDir', () => {
  it('build reads the absolute source and writes into the absolute folders, nothing under cwd', async () => {
    const result = await build(absoluteConfig());
    if (!result.ok) throw new Error(JSON.stringify(result.errors));

    expect(result.manifest.icons.map((icon) => icon.name)).toEqual(['home']);
    expect(await readdir(cwd)).toEqual([]);
    expect(
      (await readdir(outDir)).some((name) =>
        /^icons\.[0-9a-f]{8}\.svg$/.test(name),
      ),
    ).toBe(true);
    expect(await readdir(moduleDir)).toContain('manifest.json');
    expect(result.written).toContain(
      reported(join(moduleDir, 'manifest.json')),
    );
  });

  it('check compares against the absolute folders', async () => {
    const before = await check(absoluteConfig());
    if (!before.ok) throw new Error(JSON.stringify(before.errors));
    expect(before.upToDate).toBe(false);

    await build(absoluteConfig());
    const after = await check(absoluteConfig());
    if (!after.ok) throw new Error(JSON.stringify(after.errors));
    expect(after.upToDate).toBe(true);
    expect(await readdir(cwd)).toEqual([]);
  });

  it('watch watches the absolute source folder', async () => {
    const watched: string[] = [];
    const factory: WatcherFactory = (path) => {
      watched.push(path);
      return { close: () => undefined };
    };
    const results: BuildResult[] = [];
    const controller = new AbortController();
    const done = watch(absoluteConfig(), {
      onResult: (result) => results.push(result),
      createWatcher: factory,
      debounceMs: 5,
      signal: controller.signal,
    });
    await vi.waitFor(
      () => {
        expect(results).toHaveLength(1);
      },
      { timeout: 5000 },
    );
    controller.abort();
    await done;

    expect(watched).toEqual([sourceDir]);
    expect(results[0]?.ok).toBe(true);
    expect(await readdir(cwd)).toEqual([]);
  });

  it('resolveConfig checks overlaps on the same absolute folders the build uses', () => {
    expect(() =>
      resolveConfig(
        {
          sources: [sourceDir],
          outDir: join(sourceDir, 'out'),
          publicPath: '/sprites',
        },
        cwd,
      ),
    ).toThrow(/outDir: .* is inside a source folder/);
    expect(() =>
      resolveConfig(
        {
          sources: [sourceDir],
          outDir,
          publicPath: '/sprites',
          moduleDir: join(outDir, 'module'),
        },
        cwd,
      ),
    ).toThrow(/moduleDir: .* is inside outDir/);
    expect(() =>
      resolveConfig(
        {
          sources: [sourceDir, '../elsewhere/icons'],
          outDir,
          publicPath: '/s',
        },
        cwd,
      ),
    ).toThrow(/overlap/);
  });
});
