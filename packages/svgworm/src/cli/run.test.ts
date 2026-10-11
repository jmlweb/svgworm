import { mkdir, mkdtemp, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { CliIo } from './io.ts';

import { ExitCode } from './exit-codes.ts';
import { run } from './run.ts';

let root = '';

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'svgworm-cli-'));
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

const exists = (relative: string): Promise<boolean> =>
  stat(join(root, relative)).then(
    () => true,
    () => false,
  );

const exec = async (argv: readonly string[]) => {
  let stdout = '';
  let stderr = '';
  const io: CliIo = {
    stdout: { write: (text) => (stdout += text) },
    stderr: { write: (text) => (stderr += text) },
    env: {},
    isTTY: false,
    cwd: root,
  };
  const code = await run(argv, io);
  return { code, stdout, stderr };
};

describe('run: exit codes', () => {
  it('exits 0 and writes the output', async () => {
    await put('icons/home.svg');
    const { code, stderr } = await exec(['--source', 'icons']);
    expect(code).toBe(ExitCode.OK);
    expect(stderr).toBe('');
    expect(await exists('svgworm/manifest.json')).toBe(true);
  });

  it('exits 0 for --help and --version', async () => {
    expect((await exec(['--help'])).stdout).toContain('Exit codes:');
    expect((await exec(['--version'])).stdout).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('exits 1 on an invalid SVG and writes nothing (R-04)', async () => {
    await put('icons/home.svg');
    await put('icons/broken.svg', '<svg');
    const { code, stdout, stderr } = await exec(['--source', 'icons']);
    expect(code).toBe(ExitCode.FAILED);
    expect(stderr).toContain('svg/not-svg-root');
    expect(stderr).toContain('icons/broken.svg');
    expect(stdout).not.toContain('build done');
    expect(await exists('public')).toBe(false);
    expect(await exists('svgworm')).toBe(false);
  });

  it('exits 1 on a name collision and lists both files', async () => {
    await put('icons/arrow_left.svg');
    await put('icons/arrow-left.svg');
    const { code, stderr } = await exec(['--source', 'icons']);
    expect(code).toBe(ExitCode.FAILED);
    expect(stderr).toContain('icons/arrow-left.svg, icons/arrow_left.svg');
  });

  it('exits 1 on an unexpected I/O failure', async () => {
    await put('icons/home.svg');
    await put('svgworm', 'a file where the module folder should go');
    const { code, stderr } = await exec(['--source', 'icons']);
    expect(code).toBe(ExitCode.FAILED);
    expect(stderr).toContain('unexpected failure');
  });

  it('exits 2 when there are no icons', async () => {
    await mkdir(join(root, 'icons'));
    const { code, stderr } = await exec(['--source', 'icons']);
    expect(code).toBe(ExitCode.USAGE);
    expect(stderr).toContain('build/no-icons');
    expect(await exists('svgworm')).toBe(false);
  });

  it.each([
    ['an unknown flag', ['--bogus']],
    ['an unknown command', ['deploy']],
    ['a missing source folder', ['--source', 'missing']],
    ['no sources at all', []],
    [
      '--out-dir without --public-path',
      ['--source', 'icons', '--out-dir', 'x'],
    ],
    ['a relative publicPath', ['--source', 'icons', '--public-path', 'icons']],
    [
      'a remote publicPath',
      ['--source', 'icons', '--public-path', 'https://cdn.example.com/icons'],
    ],
    ['a missing --config file', ['--config', 'nope.json', '--source', 'icons']],
  ])('exits 2 for %s', async (_label, argv) => {
    await put('icons/home.svg');
    const { code, stdout, stderr } = await exec(argv);
    expect(code).toBe(ExitCode.USAGE);
    expect(stdout).toBe('');
    expect(stderr).toContain('svgworm:');
    expect(await exists('svgworm')).toBe(false);
  });

  it('exits 2 for a config file that is not valid', async () => {
    await put('icons/home.svg');
    await put(
      'svgworm.config.json',
      '{ "sources": ["icons"], "flatten": "yes" }',
    );
    const { code, stderr } = await exec([]);
    expect(code).toBe(ExitCode.USAGE);
    expect(stderr).toContain('flatten');
  });
});

describe('run: config file and flags', () => {
  it('reads svgworm.config.json from the working directory', async () => {
    await put('icons/home.svg');
    await put(
      'svgworm.config.json',
      '{ "sources": ["icons"], "moduleDir": "gen" }',
    );
    expect((await exec([])).code).toBe(ExitCode.OK);
    expect(await exists('gen/manifest.json')).toBe(true);
  });

  it('lets flags override the config file', async () => {
    await put('icons/a/close.svg');
    await put('icons/b/close.svg');
    await put(
      'svgworm.config.json',
      '{ "sources": ["icons"], "flatten": true }',
    );
    expect((await exec([])).code).toBe(ExitCode.FAILED);
    expect((await exec(['--no-flatten'])).code).toBe(ExitCode.OK);
  });

  it('removes stale sprites on a rebuild', async () => {
    await put('icons/home.svg');
    await exec(['--source', 'icons']);
    await put('icons/more.svg', svg.replace('M0 0', 'M1 1'));
    const { stdout } = await exec(['--source', 'icons']);
    expect(stdout).toContain('remove public/icons/icons.');
    expect(await readdir(join(root, 'public/icons'))).toHaveLength(1);
  });
});
