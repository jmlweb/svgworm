import fs from 'node:fs/promises';

import { PrettyError } from '../errors/pretty-error';
import { timeMeasurer } from '../shared/time-measurer';

export const resolveIconContent = async (iconPath: string) => {
  try {
    const stopMeasuring = timeMeasurer.start('resolveIconContent');
    const iconContent = await fs.readFile(iconPath, 'utf-8');
    stopMeasuring();
    return iconContent;
  } catch (error) {
    throw PrettyError.of(error, `Failed to read icon file ${iconPath}`);
  }
};
