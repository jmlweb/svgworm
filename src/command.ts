import path from 'node:path';

import { fdir } from 'fdir';
import colors from 'picocolors';

import loadAppConfig from './config/load-app-config';
import loadPrettierConfig from './config/load-prettier-config';
import loadSvgoConfig from './config/load-svgo-config';
import { PrettyError } from './errors';
import IdsGenerator from './ids/ids-generator';
import resolveDest from './resolve-dest/resolve-dest';
import Wormer from './wormer/wormer';

const filesCrawler = new fdir().withRelativePaths().glob('./**/*.svg');
const getFilePaths = (srcPath: string) => {
  try {
    const filePaths = filesCrawler.crawl(srcPath).sync();
    if (!filePaths.length) {
      throw new Error(`No SVG files found in ${srcPath}`);
    }
    return filePaths;
  } catch (error) {
    throw new PrettyError(
      error instanceof Error
        ? error.message
        : 'There was a problem crawling the source directory',
    );
  }
};

const command = async (
  src?: string,
  dest?: string,
  appOptions: Parameters<typeof loadAppConfig>[0] = {},
) => {
  const startTime = performance.now();
  const [svgoConfigP, prettierConfigP] = [
    loadSvgoConfig(),
    loadPrettierConfig(),
  ];

  const appConfig = await loadAppConfig({
    src,
    dest,
    ...appOptions,
  });

  const srcPath = path.resolve(process.cwd(), appConfig.src);
  const destPathP = resolveDest(appConfig);
  const filePaths = getFilePaths(srcPath);
  const generateId = IdsGenerator(appConfig.flatten);
  const worm = Wormer({
    srcPath,
    destPath: await destPathP,
    force: appConfig.force,
  });

  for (const filePath of filePaths) {
    const id = generateId(filePath);
    worm.add(filePath, id);
  }

  console.log(
    colors.dim(
      `Command run time: ${(performance.now() - startTime).toFixed(3)}ms`,
    ),
  );
};

export default command;
