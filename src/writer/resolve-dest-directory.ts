import fs from 'node:fs/promises';

import { PrettyError } from '../errors/pretty-error';
import { timeMeasurer } from '../shared/time-measurer';

export const resolveDestDirectory = async (destPath: string) => {
  try {
    const stopMeasuring = timeMeasurer.start('resolveDestDirectory');
    await fs.mkdir(destPath, { recursive: true });
    stopMeasuring();
  } catch (error) {
    throw PrettyError.of(error, 'Failed to resolve destination directory');
  }
};
