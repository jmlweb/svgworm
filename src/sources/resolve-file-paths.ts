import { fdir } from 'fdir';

import { PrettyError } from '../errors/pretty-error';
import { timeMeasurer } from '../shared/time-measurer';

const filesCrawler = new fdir().withRelativePaths().glob('./**/*.svg');

export const resolveFilePaths = async (srcPath: string) => {
  const stopMeasuring = timeMeasurer.start('resolveSourcePaths');
  const filePaths = await filesCrawler.crawl(srcPath).withPromise();
  if (filePaths.length === 0) {
    throw new PrettyError(`No SVG files found in ${srcPath}`);
  }
  stopMeasuring();
  return filePaths;
};
