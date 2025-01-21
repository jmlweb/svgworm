import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { env } from 'node:process';

import pkg from '../../package.json';
import { timeMeasurer } from '../shared/time-measurer';
import { findPackageJSON } from './find-pkg';

// Cache package info
const { name: NAME, version: VERSION } = pkg;

// Pre-compile boolean-like values for faster lookup
const BOOLEAN_VALUES = new Set(['true', 'false', '1', '0']);

// Memoize path.join for common args
const appendKeys = (...args: string[]) => {
  const base = path.join(...args);
  return path.join(base, NAME, VERSION);
};

const findCacheDir = async () => {
  const { CACHE_DIR } = env;
  if (CACHE_DIR && !BOOLEAN_VALUES.has(CACHE_DIR)) {
    return appendKeys(CACHE_DIR);
  }

  const rootPkgJSONPath = await findPackageJSON();
  return rootPkgJSONPath
    ? appendKeys(path.dirname(rootPkgJSONPath), 'node_modules', '.cache')
    : appendKeys(os.tmpdir());
};

export const resolveCacheDir = async () => {
  const stopMeasuring = timeMeasurer.start('resolveCacheDir');
  const cacheDir = await findCacheDir();
  await fs.mkdir(cacheDir, { recursive: true });
  stopMeasuring();
  return cacheDir;
};
