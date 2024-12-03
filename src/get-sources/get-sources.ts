import { fdir } from 'fdir';

import { PrettyError } from '../errors';
import IdsGenerator from './ids-generator';

const filesCrawler = new fdir().withRelativePaths().glob('./**/*.svg');

const getSources = async ({
  srcPath,
  flatten,
}: {
  srcPath: string;
  flatten: boolean;
}): Promise<[id: string, filePath: string][]> => {
  const generateId = IdsGenerator(flatten);
  try {
    const filePaths = await filesCrawler.crawl(srcPath).withPromise();
    if (!filePaths.length) {
      throw new Error(`No SVG files found in ${srcPath}`);
    }
    return filePaths.map(
      (filePath) => [generateId(filePath), filePath] as const,
    );
  } catch (error) {
    throw new PrettyError(
      `There was a problem crawling the source directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
};

export default getSources;
