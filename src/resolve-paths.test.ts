import fs from 'node:fs/promises';
import path from 'node:path';

import { PrettyError } from './errors';
import logger from './logger';
import resolvePaths from './resolve-paths';
jest.mock('node:fs/promises');
jest.mock('./logger');

describe('resolvePaths', () => {
  const mockCwd = '/Users/jmlweb/projects/svgworm';
  const mockSrc = 'src';
  const mockDest = 'dest';
  const mockSrcPath = path.resolve(mockCwd, mockSrc);
  const mockDestPath = path.resolve(mockCwd, mockDest);

  beforeEach(() => {
    jest.spyOn(process, 'cwd').mockReturnValue(mockCwd);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should resolve source and destination paths', async () => {
    (fs.access as jest.Mock).mockResolvedValueOnce(true);
    (fs.access as jest.Mock).mockResolvedValueOnce(true);

    const paths = await resolvePaths({
      src: mockSrc,
      dest: mockDest,
      clean: false,
    });

    expect(paths).toEqual({ src: mockSrcPath, dest: mockDestPath });
  });

  it('should throw an error if the source directory does not exist', async () => {
    (fs.access as jest.Mock).mockRejectedValueOnce(new Error('Not found'));
    (fs.access as jest.Mock).mockResolvedValueOnce(true);

    await expect(
      resolvePaths({ src: mockSrc, dest: mockDest, clean: false }),
    ).rejects.toThrow(PrettyError);
  });

  it('should clean the destination directory if it exists and clean is true', async () => {
    (fs.access as jest.Mock).mockResolvedValueOnce(true);
    (fs.access as jest.Mock).mockResolvedValueOnce(true);
    (fs.readdir as jest.Mock).mockResolvedValueOnce(['file1.txt', 'file2.txt']);
    (fs.unlink as jest.Mock).mockResolvedValueOnce(undefined);

    await resolvePaths({ src: mockSrc, dest: mockDest, clean: true });

    expect(fs.readdir).toHaveBeenCalledWith(mockDestPath);
    expect(fs.unlink).toHaveBeenCalledTimes(2);
  });

  it('should create the destination directory if it does not exist', async () => {
    (fs.access as jest.Mock).mockResolvedValueOnce(true);
    (fs.access as jest.Mock).mockRejectedValueOnce(new Error('Not found'));
    (fs.mkdir as jest.Mock).mockResolvedValueOnce(undefined);

    await resolvePaths({ src: mockSrc, dest: mockDest, clean: false });

    expect(fs.mkdir).toHaveBeenCalledWith(mockDestPath, { recursive: true });
  });

  it('should log an error if there is a problem cleaning the destination directory', async () => {
    (fs.access as jest.Mock).mockResolvedValueOnce(true);
    (fs.access as jest.Mock).mockResolvedValueOnce(true);
    (fs.readdir as jest.Mock).mockResolvedValueOnce(['file1.txt']);
    (fs.unlink as jest.Mock).mockRejectedValueOnce(
      new Error('Permission denied'),
    );

    await resolvePaths({ src: mockSrc, dest: mockDest, clean: true });

    expect(logger.error).toHaveBeenCalled();
  });

  it('should throw an error if the destination directory could not be created', async () => {
    (fs.access as jest.Mock).mockResolvedValueOnce(true);
    (fs.access as jest.Mock).mockRejectedValueOnce(new Error('Not found'));
    (fs.mkdir as jest.Mock).mockRejectedValueOnce(
      new Error('Permission denied'),
    );

    await expect(
      resolvePaths({ src: mockSrc, dest: mockDest, clean: false }),
    ).rejects.toThrow(PrettyError);
  });
});
