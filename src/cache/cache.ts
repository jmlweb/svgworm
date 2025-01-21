import path from 'node:path';

import { Config } from '../config/schemas';
import { md5 } from '../shared/md5';
import { timeMeasurer } from '../shared/time-measurer';
import { resolveCacheContent } from './resolve-cache-content';
import { writeCacheContent } from './write-cache-content';

const FileHashBuilder = (
  config: Pick<Config, 'color' | 'flatten' | 'mode' | 'prefix'>,
) => {
  const configHash = md5(
    [
      config.color.toString(),
      config.flatten.toString(),
      config.mode.toString(),
      config.prefix ?? '',
    ].join('|'),
  );

  return <A>(args: A[]) => {
    const stopMeasuring = timeMeasurer.start('cache.buildHash');
    const result = md5(`${configHash}${md5(args.join(''))}`);
    stopMeasuring();
    return result;
  };
};

export const Cache = <A>({
  config,
  cacheDir,
  fn,
}: {
  config: Parameters<typeof FileHashBuilder>[0];
  cacheDir: string;
  fn: (...args: A[]) => string;
}) => {
  const buildFileHash = FileHashBuilder(config);

  return async (...args: A[]) => {
    const filePath = path.join(cacheDir, buildFileHash(args));
    const content = await resolveCacheContent(filePath);
    if (!content) {
      const result = fn(...args);
      const stopMeasuring = timeMeasurer.start('writeCache');
      await writeCacheContent(filePath, result);
      stopMeasuring();
      return result;
    }
    return content;
  };
};
