import fs from 'node:fs/promises';

import { resolveCacheContent } from './resolve-cache-content';

jest.mock('node:fs/promises');

describe('resolveCacheContent', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return null if file does not exist', async () => {
    (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));
    const result = await resolveCacheContent('nonexistent.txt');
    expect(result).toBeNull();
  });

  it('should return file content if file exists', async () => {
    (fs.readFile as jest.Mock).mockResolvedValue('file content');
    const result = await resolveCacheContent('existent.txt');
    expect(result).toBe('file content');
  });
});
