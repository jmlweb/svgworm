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

describe('discoverSvgFiles: include and exclude', () => {
  beforeEach(async () => {
    await touch('pkg/icons/house.svg');
    await touch('pkg/icons/arrow-left.svg');
    await touch('pkg/icons/arrow-big-left.svg');
    await touch('pkg/icons/sub/arrow-right.svg');
    await touch('pkg/icons/menu.svg');
  });

  it('keeps only the files that match an include glob', async () => {
    const result = await discoverSvgFiles(root, [
      { dir: 'pkg/icons', include: ['house.svg', 'arrow-*.svg'] },
    ]);
    expect(result.files.map((file) => file.relativePath)).toEqual([
      'arrow-big-left.svg',
      'arrow-left.svg',
      'house.svg',
    ]);
  });

  it('matches folders with ** and drops exclude matches after include', async () => {
    const result = await discoverSvgFiles(root, [
      {
        dir: 'pkg/icons',
        include: ['**/arrow-*.svg'],
        exclude: ['arrow-big-*.svg'],
      },
    ]);
    expect(result.files.map((file) => file.relativePath)).toEqual([
      'arrow-left.svg',
      'sub/arrow-right.svg',
    ]);
  });

  it('treats a plain string and { dir } the same', async () => {
    const plain = await discoverSvgFiles(root, ['pkg/icons']);
    const object = await discoverSvgFiles(root, [{ dir: 'pkg/icons' }]);
    expect(object).toEqual(plain);
    expect(plain.files).toHaveLength(5);
  });

  it('follows a source folder that is itself a symlink (pnpm packages)', async () => {
    await symlink(join(root, 'pkg'), join(root, 'linked'), 'dir');
    const result = await discoverSvgFiles(root, [
      { dir: 'linked/icons', include: ['menu.svg'] },
    ]);
    expect(result.files.map((file) => file.path)).toEqual([
      'linked/icons/menu.svg',
    ]);
  });
});

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

  it('finds the file whatever the on-disk Unicode form', async () => {
    await touch(`icons/${'café'.normalize('NFD')}.svg`);
    const result = await discoverSvgFiles(root, ['icons']);
    expect(result.files.map((file) => file.path.normalize('NFC'))).toEqual([
      'icons/café.svg',
    ]);
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
