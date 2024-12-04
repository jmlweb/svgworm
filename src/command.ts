import path from 'node:path';

import colors from 'picocolors';

import loadAppConfig from './config/load-app-config';
import Formatter from './formatter/formatter';
import getSources from './get-sources/get-sources';
import resolveDest from './resolve-dest/resolve-dest';
import resultsWriter from './results-writer/results-writer';
import SpriteBuilder from './sprite-builder/sprite-builder';
import timeMeasure from './time-measure/time-measure';

const command = async (
  src: string,
  dest: string,
  appOptions: Parameters<typeof loadAppConfig>[0],
) => {
  timeMeasure.start();

  const formatterP = Formatter();
  const appConfig = await loadAppConfig({
    ...appOptions,
    src,
    dest,
  });
  const srcPath = path.resolve(process.cwd(), appConfig.src);
  const destPathP = resolveDest(appConfig);
  const [sources, spriteBuilder] = await Promise.all([
    getSources({
      srcPath,
      flatten: appConfig.flatten,
    }),
    SpriteBuilder(srcPath, appConfig.force),
  ]);

  const [results, formatter, destPath] = await Promise.all([
    spriteBuilder(sources),
    formatterP,
    destPathP,
  ]);

  if (results.errors.length) {
    console.table(results.errors);
  }

  await resultsWriter({
    results,
    formatter,
    destPath,
  });

  console.log(
    colors.green(
      `🎉 A new sprite has been generated with ${results.data.length} icons`,
    ),
  );
  console.log(colors.dim(`⏳ Command run time: ${timeMeasure.get()}ms`));
};

export default command;
