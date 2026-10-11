import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { discoverSvgFiles } from './discover.ts';

let root = '';

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'svgworm-discover-'));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const touch = async (relative: string): Promise<void> => {
  const path = join(root, relative);
  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(path, '<svg/>');
};

describe('discoverSvgFiles', () => {
  it('finds .svg files case-insensitively and skips everything else', async () => {
    await touch('icons/home.svg');
    await touch('icons/Close.SVG');
    await touch('icons/readme.txt');
    await touch('icons/.hidden.svg');
    await touch('icons/._mac.svg');
    await touch('icons/.git/inner.svg');
    await touch('icons/folder.svg/inner.svg');
    await touch('icons/social/github.svg');

    const result = await discoverSvgFiles(root, ['icons']);

    expect(result.errors).toEqual([]);
    expect(result.files.map((file) => file.path)).toEqual([
      'icons/Close.SVG',
      'icons/folder.svg/inner.svg',
      'icons/home.svg',
      'icons/social/github.svg',
    ]);
    expect(result.files.map((file) => file.relativePath)).toEqual([
      'Close.SVG',
      'folder.svg/inner.svg',
      'home.svg',
      'social/github.svg',
    ]);
  });

  it('does not follow symbolic links', async () => {
    await touch('real/a.svg');
    await mkdir(join(root, 'icons'));
    try {
      await symlink(join(root, 'real'), join(root, 'icons/link'), 'dir');
      await symlink(join(root, 'real/a.svg'), join(root, 'icons/b.svg'));
    } catch {
      return; // Symlinks may need privileges on Windows.
    }
    const result = await discoverSvgFiles(root, ['icons']);
    expect(result.files).toEqual([]);
  });

  it('returns the same NFC paths whatever the on-disk Unicode form', async () => {
    await touch('icons/café.svg');
    const result = await discoverSvgFiles(root, ['icons']);
    expect(result.files.map((file) => file.path)).toEqual(['icons/café.svg']);
  });

  it('merges several source folders in one sorted list', async () => {
    await touch('b/z.svg');
    await touch('a/y.svg');
    const result = await discoverSvgFiles(root, ['b', 'a']);
    expect(result.files.map((file) => file.path)).toEqual([
      'a/y.svg',
      'b/z.svg',
    ]);
  });

  it('reports a file name that is not valid UTF-8', async (context) => {
    await mkdir(join(root, 'icons'));
    const bad = Buffer.concat([
      Buffer.from(join(root, 'icons') + '/caf'),
      Buffer.from([0xe9]),
      Buffer.from('.svg'),
    ]);
    try {
      await writeFile(bad, '<svg/>');
    } catch {
      context.skip(); // macOS and Windows file systems reject invalid names.
      return;
    }
    const result = await discoverSvgFiles(root, ['icons']);
    expect(result.files).toEqual([]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.code).toBe('path/invalid-encoding');
  });

  it('fails when a source folder does not exist', async () => {
    await expect(discoverSvgFiles(root, ['missing'])).rejects.toThrow(
      /source folder/,
    );
  });
});
