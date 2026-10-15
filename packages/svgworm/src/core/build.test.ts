import {
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { BuildEvent } from './events.ts';

import { build } from './build.ts';
import { check } from './check.ts';
import { resolveConfig, type ResolvedConfig } from './config/resolve.ts';
import { DiagnosticCode } from './errors.ts';
import { isOwnedFile } from './write.ts';

let root = '';

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'svgworm-build-'));
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

const config = (overrides: Record<string, unknown> = {}): ResolvedConfig =>
  resolveConfig({ sources: ['icons'], ...overrides }, root);

describe('build', () => {
  it('writes the sprite and the module', async () => {
    await put('icons/home.svg');
    const result = await build(config());
    if (!result.ok) throw new Error(JSON.stringify(result.errors));
    expect(
      result.written.map((path) => path.replace(/\.[0-9a-f]{8}\./, '.H.')),
    ).toEqual([
      'public/icons/icons.H.svg',
      'svgworm/icons.js',
      'svgworm/icons.d.ts',
      'svgworm/manifest.json',
    ]);
    expect(result.manifest.icons.map((icon) => icon.name)).toEqual(['home']);
    expect(await readdir(join(root, 'public/icons'))).toEqual([
      result.manifest.sprite?.file,
    ]);
    expect(await readFile(join(root, 'svgworm/manifest.json'), 'utf8')).toBe(
      result.files.find((file) => file.name === 'manifest.json')?.content,
    );
  });

  it('writes the sprite and the stack before the module', async () => {
    await put('icons/home.svg');
    await put(
      'icons/grad.svg',
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><defs><linearGradient id="g"><stop stop-color="#f00"/><stop offset="1" stop-color="#00f"/></linearGradient></defs><rect width="8" height="8" fill="url(#g)"/></svg>',
    );
    const events: BuildEvent[] = [];
    await build(config(), (event) => events.push(event));
    const writes = events.flatMap((event) =>
      event.type === 'write' ? [event.path] : [],
    );
    expect(writes).toHaveLength(5);
    expect(
      writes.slice(0, 2).every((path) => path.startsWith('public/icons/')),
    ).toBe(true);
    expect(writes.slice(2).every((path) => path.startsWith('svgworm/'))).toBe(
      true,
    );
    expect(events.at(-1)?.type).toBe('done');
  });

  it('writes nothing when any input is invalid (R-04)', async () => {
    await put('icons/home.svg');
    await put('icons/broken.svg', '<svg');
    const result = await build(config());
    expect(result.ok).toBe(false);
    expect(await exists('public')).toBe(false);
    expect(await exists('svgworm')).toBe(false);
  });

  it('keeps previous output when the new input is invalid', async () => {
    await put('icons/home.svg');
    await build(config());
    const before = await readdir(join(root, 'public/icons'));
    await put('icons/broken.svg', '<svg');
    await build(config());
    expect(await readdir(join(root, 'public/icons'))).toEqual(before);
  });

  it('fails with a no-icons error when the folder has no svg', async () => {
    await mkdir(join(root, 'icons'));
    const result = await build(config());
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.errors.map((error) => error.code)).toEqual([
        DiagnosticCode.NO_ICONS,
      ]);
    expect(await exists('svgworm')).toBe(false);
  });

  it('removes only stale hashed sprite files (R-15)', async () => {
    await put('icons/home.svg');
    await put('public/icons/icons.00000000.svg', 'old');
    await put('public/icons/icons.stack.deadbeef.svg', 'old');
    await put('public/icons/icons.svg', 'foreign');
    await put('public/icons/icons.1234567.svg', 'foreign');
    await put('public/icons/icons.ABCDEF12.svg', 'foreign');
    await put('public/icons/logo.0123abcd.svg', 'foreign');
    await put('public/icons/readme.txt', 'foreign');
    await mkdir(join(root, 'public/icons/icons.aaaaaaaa.svg'));
    await put('svgworm/notes.md', 'foreign');
    const result = await build(config());
    if (!result.ok) throw new Error(JSON.stringify(result.errors));
    expect(result.removed).toEqual([
      'public/icons/icons.00000000.svg',
      'public/icons/icons.stack.deadbeef.svg',
    ]);
    const left = await readdir(join(root, 'public/icons'));
    expect(left.toSorted()).toEqual(
      [
        'icons.1234567.svg',
        'icons.ABCDEF12.svg',
        'icons.aaaaaaaa.svg',
        'icons.svg',
        'logo.0123abcd.svg',
        'readme.txt',
        result.manifest.sprite?.file ?? '',
      ].toSorted(),
    );
    expect(await exists('svgworm/notes.md')).toBe(true);
  });

  it('is idempotent, and a rebuild with the same input rewrites nothing', async () => {
    await put('icons/home.svg');
    const first = await build(config());
    const events: BuildEvent[] = [];
    const second = await build(config(), (event) => events.push(event));
    if (!first.ok || !second.ok) throw new Error('build failed');
    expect(second.removed).toEqual([]);
    expect(second.written).toEqual(first.written);
    // Untouched files keep a dev server's watcher quiet (ADR-0015).
    expect(events.filter((event) => event.type === 'write')).toEqual([]);
  });

  it('replaces a symlinked output file instead of writing through it', async () => {
    await put('icons/home.svg');
    await put('elsewhere/keep.txt', 'mine');
    await mkdir(join(root, 'svgworm'), { recursive: true });
    await symlink(
      join(root, 'elsewhere/keep.txt'),
      join(root, 'svgworm/icons.js'),
    );
    const result = await build(config());
    if (!result.ok) throw new Error(JSON.stringify(result.errors));
    expect(await readFile(join(root, 'elsewhere/keep.txt'), 'utf8')).toBe(
      'mine',
    );
    expect((await lstat(join(root, 'svgworm/icons.js'))).isSymbolicLink()).toBe(
      false,
    );
    expect(await readdir(join(root, 'svgworm'))).toEqual([
      'icons.d.ts',
      'icons.js',
      'manifest.json',
    ]);
  });

  it('builds the same output for an NFD file name', async () => {
    await put('icons/café.svg');
    const nfc = await build(config());
    await rm(join(root, 'icons/café.svg'));
    await put(`icons/${'café'.normalize('NFD')}.svg`);
    const nfd = await build(config());
    if (!nfc.ok || !nfd.ok) throw new Error('build failed');
    expect(nfd.files).toEqual(nfc.files);
    expect(nfd.removed).toEqual([]);
  });

  it('honors outDir and moduleDir', async () => {
    await put('icons/home.svg');
    const result = await build(
      config({
        outDir: 'static/sprites',
        publicPath: '/sprites',
        moduleDir: 'generated',
      }),
    );
    if (!result.ok) throw new Error('build failed');
    expect(await exists('static/sprites')).toBe(true);
    expect(await exists('generated/manifest.json')).toBe(true);
    expect(result.manifest.sprite?.url.startsWith('/sprites/icons.')).toBe(
      true,
    );
  });
});

describe('build: crossOrigin inject (ADR-0027)', () => {
  const inject = () =>
    config({
      outDir: 'public/icons',
      publicPath: 'https://cdn.example.com/icons',
      crossOrigin: 'inject',
    });

  it('owns exactly the hashed loader besides the sprite and stack', () => {
    expect(isOwnedFile('icons.loader.0123abcd.js')).toBe(true);
    for (const name of [
      'icons.loader.0123abcd.svg',
      'icons.0123abcd.js',
      'icons.loader.0123ABCD.js',
      'icons.loader.0123abc.js',
      'icons.loader.js',
      'app.loader.0123abcd.js',
    ]) {
      expect(isOwnedFile(name)).toBe(false);
    }
  });

  it('writes the loader, stays up to date for check, and removes a stale loader', async () => {
    await put('icons/home.svg');
    await put('public/icons/icons.loader.00000000.js', 'old');
    await put('public/icons/app.js', 'foreign');
    const result = await build(inject());
    if (!result.ok) throw new Error(JSON.stringify(result.errors));
    expect(result.removed).toEqual(['public/icons/icons.loader.00000000.js']);
    const left = (await readdir(join(root, 'public/icons'))).toSorted();
    expect(
      left.some((name) => /^icons\.loader\.[0-9a-f]{8}\.js$/.test(name)),
    ).toBe(true);
    expect(left).toContain('app.js');
    const checked = await check(inject());
    expect(checked.ok && checked.upToDate).toBe(true);
    const manifest = await readFile(
      join(root, 'svgworm/manifest.json'),
      'utf8',
    );
    expect(manifest).toContain('"version": 2');
  });
});
