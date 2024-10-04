import fs from 'node:fs/promises';
import path from 'node:path';

import { fdir } from 'fdir';

import { PrettyError } from './errors';
import resolvePaths from './resolve-paths';

jest.mock('node:fs/promises');
jest.mock('fdir');

describe('resolvePaths', () => {
  const mockCwd = '/Users/jmlweb/projects/svgworm';
  const src = 'src';
  const dest = 'dest';
  const resolvedSrc = path.resolve(mockCwd, src);
  const resolvedDest = path.resolve(mockCwd, dest);

  beforeEach(() => {
    jest.spyOn(process, 'cwd').mockReturnValue(mockCwd);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should resolve paths correctly', async () => {
    (fs.access as jest.Mock).mockResolvedValue(true);
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);

    const paths = await resolvePaths({ src, dest, clean: false });

    expect(paths).toEqual({ src: resolvedSrc, dest: resolvedDest });
  });

  it('should throw an error if the source directory does not exist', async () => {
    (fs.access as jest.Mock).mockRejectedValueOnce(new Error('Not found'));

    await expect(resolvePaths({ src, dest, clean: false })).rejects.toThrow(
      new PrettyError(`The source directory does not exist: ${resolvedSrc}`),
    );
  });

  it('should create the destination directory if it does not exist', async () => {
    (fs.access as jest.Mock)
      .mockResolvedValueOnce(true)
      .mockRejectedValueOnce(new Error('Not found'));
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);

    await resolvePaths({ src, dest, clean: false });

    expect(fs.mkdir).toHaveBeenCalledWith(resolvedDest, { recursive: true });
  });

  it('should throw an error if the destination directory cannot be created', async () => {
    (fs.access as jest.Mock)
      .mockResolvedValueOnce(true)
      .mockRejectedValueOnce(new Error('Not found'));
    (fs.mkdir as jest.Mock).mockRejectedValueOnce(
      new Error('Permission denied'),
    );

    await expect(resolvePaths({ src, dest, clean: false })).rejects.toThrow(
      new PrettyError(
        `The destination directory could not be created: ${resolvedDest}`,
      ),
    );
  });

  it('should clean the destination directory if it exists and clean is true', async () => {
    (fs.access as jest.Mock).mockResolvedValue(true);
    const mockFiles = ['index.ts', 'icon.tsx', 'sprite.tsx', 'types.ts'];
    const mockApi = { sync: jest.fn().mockReturnValue(mockFiles) };
    (fdir as jest.Mock).mockImplementation(() => ({
      withRelativePaths: jest.fn().mockReturnThis(),
      glob: jest.fn().mockReturnThis(),
      crawl: jest.fn().mockReturnValue(mockApi),
    }));
    (fs.unlink as jest.Mock).mockResolvedValue(undefined);

    await resolvePaths({ src, dest, clean: true });

    expect(fdir).toHaveBeenCalled();
    expect(fs.unlink).toHaveBeenCalledTimes(mockFiles.length);
    mockFiles.forEach((file) => {
      expect(fs.unlink).toHaveBeenCalledWith(path.join(resolvedDest, file));
    });
  });

  it('should throw an error if there is a problem cleaning the destination directory', async () => {
    (fs.access as jest.Mock).mockResolvedValue(true);
    const mockApi = { sync: jest.fn().mockReturnValue(['index.ts']) };
    (fdir as jest.Mock).mockImplementation(() => ({
      withRelativePaths: jest.fn().mockReturnThis(),
      glob: jest.fn().mockReturnThis(),
      crawl: jest.fn().mockReturnValue(mockApi),
    }));
    (fs.unlink as jest.Mock).mockRejectedValueOnce(
      new Error('Permission denied'),
    );

    await expect(resolvePaths({ src, dest, clean: true })).rejects.toThrow(
      new PrettyError(
        `There was a problem cleaning the destination directory: ${resolvedDest}\nPermission denied`,
      ),
    );
  });
});
