import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ConfigError } from '../errors.ts';
import { loadConfig, resolveConfig } from './resolve.ts';

let cwd = '';
beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'svgworm-config-'));
});
afterEach(async () => {
  await rm(cwd, { recursive: true, force: true });
});

const issuesOf = (run: () => unknown): readonly string[] => {
  try {
    run();
  } catch (error) {
    if (error instanceof ConfigError) return error.issues;
    throw error;
  }
  throw new Error('expected a ConfigError');
};

describe('resolveConfig', () => {
  it('applies defaults', () => {
    expect(resolveConfig({ sources: ['icons'] }, cwd)).toEqual({
      cwd,
      sources: [{ dir: 'icons' }],
      outDir: 'public/icons',
      publicPath: '/icons',
      moduleDir: 'svgworm',
      flatten: false,
      color: [],
      crossOrigin: 'none',
    });
  });

  it('keeps an https publicPath only with crossOrigin inject', () => {
    const config = resolveConfig(
      {
        sources: ['i'],
        outDir: 'out',
        publicPath: 'https://cdn.example.com/icons/',
        crossOrigin: 'inject',
      },
      cwd,
    );
    expect(config.publicPath).toBe('https://cdn.example.com/icons');
    expect(config.crossOrigin).toBe('inject');
    const issues = issuesOf(() =>
      resolveConfig(
        {
          sources: ['i'],
          outDir: 'out',
          publicPath: 'https://cdn.example.com/icons',
        },
        cwd,
      ),
    );
    expect(issues.join('\n')).toContain('crossOrigin');
  });

  it('keeps include and exclude globs of an object source', () => {
    const config = resolveConfig(
      {
        sources: [
          { dir: 'node_modules/lucide-static/icons', include: ['house.svg'] },
          { dir: 'icons', exclude: ['draft-*.svg'] },
        ],
      },
      cwd,
    );
    expect(config.sources).toEqual([
      { dir: 'node_modules/lucide-static/icons', include: ['house.svg'] },
      { dir: 'icons', exclude: ['draft-*.svg'] },
    ]);
  });

  it('rejects overlapping folders given as objects too', () => {
    const issues = issuesOf(() =>
      resolveConfig(
        { sources: [{ dir: 'icons', include: ['a.svg'] }, 'icons/brand'] },
        cwd,
      ),
    );
    expect(issues.join('\n')).toMatch(/"icons" and "icons\/brand" overlap/);
  });

  it('normalizes the public path', () => {
    const config = resolveConfig(
      { sources: ['i'], outDir: 'out', publicPath: '/docs/icons/' },
      cwd,
    );
    expect(config.publicPath).toBe('/docs/icons');
  });

  it('rejects outDir without publicPath', () => {
    const issues = issuesOf(() =>
      resolveConfig({ sources: ['i'], outDir: 'static/sprites' }, cwd),
    );
    expect(issues.join('\n')).toMatch(/outDir.*publicPath/);
  });

  it('accepts publicPath without outDir', () => {
    expect(
      resolveConfig({ sources: ['i'], publicPath: '/x' }, cwd).outDir,
    ).toBe('public/icons');
  });

  it('rejects overlapping sources', () => {
    const issues = issuesOf(() =>
      resolveConfig({ sources: ['icons', 'icons/brand'] }, cwd),
    );
    expect(issues.join('\n')).toMatch(/overlap/);
    expect(() =>
      resolveConfig({ sources: ['icons', './icons/'] }, cwd),
    ).toThrow(ConfigError);
  });

  it('rejects an output folder inside a source folder', () => {
    const issues = issuesOf(() => resolveConfig({ sources: ['public'] }, cwd));
    expect(issues.join('\n')).toMatch(/outDir.*inside.*source/);
  });

  it('rejects moduleDir inside outDir', () => {
    const issues = issuesOf(() =>
      resolveConfig(
        {
          sources: ['i'],
          outDir: 'public/icons',
          publicPath: '/icons',
          moduleDir: 'public/icons/gen',
        },
        cwd,
      ),
    );
    expect(issues.join('\n')).toMatch(/moduleDir.*outDir/);
  });

  it('reports every problem with its path', () => {
    const issues = issuesOf(() =>
      resolveConfig({ sources: [], publicPath: 'x', flatten: 'yes' }, cwd),
    );
    expect(issues.length).toBeGreaterThanOrEqual(2);
    expect(issues.some((issue) => issue.startsWith('sources'))).toBe(true);
  });
});

describe('loadConfig', () => {
  it('reads svgworm.config.json from cwd', async () => {
    await writeFile(
      join(cwd, 'svgworm.config.json'),
      JSON.stringify({ sources: ['icons'], flatten: true }),
    );
    const config = await loadConfig({ cwd });
    expect(config.flatten).toBe(true);
    expect(config.sources).toEqual([{ dir: 'icons' }]);
  });

  it('lets overrides win over the file', async () => {
    await writeFile(
      join(cwd, 'svgworm.config.json'),
      JSON.stringify({ sources: ['icons'], flatten: true }),
    );
    const config = await loadConfig({
      cwd,
      overrides: { flatten: false, sources: ['other'] },
    });
    expect(config.flatten).toBe(false);
    expect(config.sources).toEqual([{ dir: 'other' }]);
  });

  it('works with overrides only when there is no file', async () => {
    const config = await loadConfig({ cwd, overrides: { sources: ['icons'] } });
    expect(config.sources).toEqual([{ dir: 'icons' }]);
  });

  it('fails when an explicit config file is missing', async () => {
    await expect(loadConfig({ cwd, configFile: 'nope.json' })).rejects.toThrow(
      /nope\.json/,
    );
  });

  it('fails on invalid JSON with the file name', async () => {
    await mkdir(join(cwd, 'sub'));
    await writeFile(join(cwd, 'sub', 'c.json'), '{ nope');
    await expect(loadConfig({ cwd, configFile: 'sub/c.json' })).rejects.toThrow(
      /c\.json.*JSON/s,
    );
  });

  it('fails when no source is configured anywhere', async () => {
    await expect(loadConfig({ cwd })).rejects.toThrow(ConfigError);
  });

  it('says what to do when there is no config file and no --source', async () => {
    const error = await loadConfig({ cwd }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ConfigError);
    const message = (error as ConfigError).message;
    expect(message).toContain(`no svgworm.config.json found in ${cwd}`);
    expect(message).toMatch(/svgworm init/);
    expect(message).toMatch(/--source <dir>/);
    expect(message).not.toMatch(/expected array/);
  });

  it('names the nearest config file above cwd', async () => {
    await writeFile(
      join(cwd, 'svgworm.config.json'),
      JSON.stringify({ sources: ['icons'] }),
    );
    const sub = join(cwd, 'src', 'app');
    await mkdir(sub, { recursive: true });
    const error = await loadConfig({ cwd: sub }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ConfigError);
    const message = (error as ConfigError).message;
    expect(message).toContain(`no svgworm.config.json found in ${sub}`);
    expect(message).toContain(`found one in ${cwd}`);
    expect(message).toMatch(/run svgworm from there/);
  });

  it('keeps the key path for other config errors', async () => {
    await writeFile(
      join(cwd, 'svgworm.config.json'),
      JSON.stringify({ sources: ['icons'], flatten: 'yes' }),
    );
    await expect(loadConfig({ cwd })).rejects.toThrow(/flatten/);
  });
});
