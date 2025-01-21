import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import pkg from '../../package.json';
import { findPackageJSON } from './find-pkg';
import { resolveCacheDir } from './resolve-cache-dir';

jest.mock('node:fs/promises');
jest.mock('node:os');
jest.mock('./find-pkg');

describe('resolveCacheDir', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...originalEnv };
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (os.tmpdir as jest.Mock).mockReturnValue('/tmp');
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should use CACHE_DIR env variable when provided', async () => {
    process.env.CACHE_DIR = '/custom/cache';
    const expectedPath = path.join('/custom/cache', pkg.name, pkg.version);

    const result = await resolveCacheDir();

    expect(result).toBe(expectedPath);
    expect(fs.mkdir).toHaveBeenCalledWith(expectedPath, { recursive: true });
  });

  it('should ignore CACHE_DIR when set to boolean-like values', async () => {
    process.env.CACHE_DIR = 'true';
    (findPackageJSON as jest.Mock).mockResolvedValue('/project/package.json');
    const expectedPath = path.join(
      '/project/node_modules/.cache',
      pkg.name,
      pkg.version,
    );

    const result = await resolveCacheDir();

    expect(result).toBe(expectedPath);
    expect(fs.mkdir).toHaveBeenCalledWith(expectedPath, { recursive: true });
  });

  it('should use node_modules/.cache when package.json is found', async () => {
    (findPackageJSON as jest.Mock).mockResolvedValue('/project/package.json');
    const expectedPath = path.join(
      '/project/node_modules/.cache',
      pkg.name,
      pkg.version,
    );

    const result = await resolveCacheDir();

    expect(result).toBe(expectedPath);
    expect(fs.mkdir).toHaveBeenCalledWith(expectedPath, { recursive: true });
  });

  it('should use os.tmpdir when package.json is not found', async () => {
    (findPackageJSON as jest.Mock).mockResolvedValue(undefined);
    const expectedPath = path.join('/tmp', pkg.name, pkg.version);

    const result = await resolveCacheDir();

    expect(result).toBe(expectedPath);
    expect(fs.mkdir).toHaveBeenCalledWith(expectedPath, { recursive: true });
  });

  it('should handle mkdir errors', async () => {
    process.env.CACHE_DIR = '/custom/cache';
    const error = new Error('Permission denied');
    (fs.mkdir as jest.Mock).mockRejectedValue(error);

    await expect(resolveCacheDir()).rejects.toThrow(error);
  });
});
