import fs from 'node:fs/promises';

import { timeMeasurer } from '../shared/time-measurer';

// Directly try to read the file instead of checking permissions first
// This eliminates an extra filesystem call since readFile will fail anyway if file doesn't exist
export const resolveCacheContent = async (filePath: string) => {
  const stopMeasuring = timeMeasurer.start('resolveCacheContent');
  const content = await fs.readFile(filePath, 'utf-8').catch(() => null);
  stopMeasuring();
  return content;
};
