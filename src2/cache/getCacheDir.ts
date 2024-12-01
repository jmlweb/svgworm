import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { findUpSync } from 'find-up';
import { env } from 'process';

function findCacheDir(name: string) {
  if (env.CACHE_DIR && !['true', 'false', '1', '0'].includes(env.CACHE_DIR)) {
    return path.join(env.CACHE_DIR, name);
  }
  const rootPkgJSONPath = findUpSync('package.json');
  if (rootPkgJSONPath) {
    return path.join(
      path.dirname(rootPkgJSONPath),
      'node_modules',
      '.cache',
      name,
    );
  }
  return path.resolve(os.tmpdir(), name);
}

const getCacheDir: () => string = (() => {
  let cacheDir: string;

  return () => {
    if (!cacheDir) {
      cacheDir = findCacheDir('svgworm');
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    return cacheDir;
  };
})();

export default getCacheDir;
