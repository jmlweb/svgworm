import path from 'node:path';

import { Cache } from './cache';
import { resolveCacheContent } from './resolve-cache-content';
import { writeCacheContent } from './write-cache-content';
jest.mock('./resolve-cache-content');
jest.mock('./write-cache-content');

describe('Cache', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should call the function and store the result in the cache if it is not cached', async () => {
    const fn = jest.fn().mockReturnValue('result');
    const cacheDir = '/tmp';

    const cachedFn = Cache({
      config: {
        color: false,
        flatten: false,
        mode: 'file',
      },
      cacheDir,
      fn,
    });

    const result = await cachedFn('arg1', 'arg2');
    expect(result).toBe('result');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    expect(writeCacheContent).toHaveBeenCalledWith(
      path.join(cacheDir, '2fb1c8f64149af1087424b0377481379'),
      'result',
    );
  });
  it('should return the cached result if it is cached', async () => {
    (resolveCacheContent as jest.Mock).mockResolvedValue('result');
    const fn = jest.fn().mockReturnValue('result');
    const cacheDir = '/tmp';

    const cachedFn = Cache({
      config: {
        color: false,
        flatten: false,
        mode: 'file',
      },
      cacheDir,
      fn,
    });

    const result = await cachedFn('arg1', 'arg2');
    expect(result).toBe('result');
    expect(fn).not.toHaveBeenCalled();
  });

  it('should handle prefix in config', async () => {
    const fn = jest.fn().mockReturnValue('result');
    const cacheDir = '/tmp';

    const cachedFn = Cache({
      config: {
        color: false,
        flatten: false,
        mode: 'file',
        prefix: 'test',
      },
      cacheDir,
      fn,
    });

    const result = await cachedFn('arg1', 'arg2');
    expect(result).toBe('result');
    expect(writeCacheContent).toHaveBeenCalledWith(
      path.join(cacheDir, expect.stringContaining('test')),
      'result',
    );
  });

  it('should handle write errors gracefully', async () => {
    const fn = jest.fn().mockReturnValue('result');
    (writeCacheContent as jest.Mock).mockRejectedValue(
      new Error('Write failed'),
    );

    const cachedFn = Cache({
      config: {
        color: false,
        flatten: false,
        mode: 'file',
      },
      cacheDir: '/tmp',
      fn,
    });

    const result = await cachedFn('arg1', 'arg2');
    expect(result).toBe('result');
  });

  it('should generate different hashes for different configs', async () => {
    const fn = jest.fn().mockReturnValue('result');
    const cacheDir = '/tmp';
    const hashes = new Set();

    const configs = [
      { color: false, flatten: false, mode: 'file' },
      { color: true, flatten: false, mode: 'file' },
      { color: false, flatten: true, mode: 'file' },
      { color: false, flatten: false, mode: 'component' },
    ];

    for (const config of configs) {
      const cachedFn = Cache({
        config,
        cacheDir,
        fn,
      });

      await cachedFn('arg1', 'arg2');
      const lastCall = (writeCacheContent as jest.Mock).mock.calls.slice(-1)[0];
      const hash = path.basename(lastCall[0]);
      hashes.add(hash);
    }

    expect(hashes.size).toBe(configs.length);
  });

  it('should generate same hash for same inputs', async () => {
    const fn = jest.fn().mockReturnValue('result');
    const cacheDir = '/tmp';
    const config = {
      color: false,
      flatten: false,
      mode: 'file',
    };

    const cachedFn = Cache({
      config,
      cacheDir,
      fn,
    });

    await cachedFn('arg1', 'arg2');
    await cachedFn('arg1', 'arg2');

    const calls = (writeCacheContent as jest.Mock).mock.calls;
    expect(calls.length).toBe(1);
    expect(calls[0][0]).toBe(
      path.join(cacheDir, '2fb1c8f64149af1087424b0377481379'),
    );
  });
});
