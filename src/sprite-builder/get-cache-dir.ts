import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { env } from 'node:process';

import pkg from '../../package.json';

const NAME = pkg.name;
const VERSION = pkg.version;

const findCacheDir = async () => {
  if (env.CACHE_DIR && !['true', 'false', '1', '0'].includes(env.CACHE_DIR)) {
    return path.join(env.CACHE_DIR, NAME, VERSION);
  }
  const rootPkgJSONPath = await (
    await import('find-up')
  ).findUp('package.json');
  if (rootPkgJSONPath) {
    return path.join(
      path.dirname(rootPkgJSONPath),
      'node_modules',
      '.cache',
      NAME,
      VERSION,
    );
  }
  return path.resolve(os.tmpdir(), NAME, VERSION);
};

const getCacheDir = async () => {
  const cacheDir = await findCacheDir();
  await fs.mkdir(cacheDir, { recursive: true });
  return cacheDir;
};

export default getCacheDir;
