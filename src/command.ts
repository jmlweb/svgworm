import path from 'node:path';

import colors from 'picocolors';
import yoctoSpinner from 'yocto-spinner';

import { ArtifactsResolver } from './artifacts/artifacts-resolver';
import { Cache } from './cache/cache';
import { resolveCacheDir } from './cache/resolve-cache-dir';
import { resolveConfig } from './config/resolve-config';
import { CliOptionsInput } from './config/types';
import { IconFormatter } from './icon/icon-formatter';
import { resolveIconContent } from './icon/resolve-icon-content';
import { resolveResults } from './results/resolve-results';
import { timeMeasurer } from './shared/time-measurer';
import { resolveSources } from './sources/resolve-sources';

export const command = async (
  cliSrc?: string,
  cliDest?: string,
  cliOptions?: CliOptionsInput,
) => {
  cliOptions = {
    src: cliSrc,
    dest: cliDest,
    ...cliOptions,
  };
  if (!cliOptions.src) {
    delete cliOptions.src;
  }
  if (!cliOptions.dest) {
    delete cliOptions.dest;
  }
  const config = await resolveConfig(cliOptions);
  const stopMeasuring = timeMeasurer.start('main.run');
  const paths = {
    src: path.join(process.cwd(), config.src),
    dest: path.join(process.cwd(), config.dest),
  };
  const spinner = yoctoSpinner({
    text: `Searching for SVG files in ${colors.whiteBright(paths.src)}`,
  }).start();
  const resolveArtifacts = ArtifactsResolver({ config, destPath: paths.dest });
  const [sources, cacheDir] = await Promise.all([
    resolveSources({
      config,
      srcPath: paths.src,
    }),
    config.cache ? resolveCacheDir() : null,
  ]);
  const formatIcon =
    config.cache && cacheDir
      ? Cache({
          config,
          cacheDir,
          fn: IconFormatter(config),
        })
      : IconFormatter(config);
  const iconPipeline = async ([id, filePath]: [string, string]) => {
    const iconContent = await resolveIconContent(
      path.join(paths.src, filePath),
    );
    const formattedIcon = await formatIcon(id, iconContent);
    return [id, formattedIcon] as [string, string];
  };
  spinner.text = `Processing ${sources.length} icons`;
  const results = await resolveResults({ sources, iconPipeline });
  stopMeasuring();
  const artifacts = await resolveArtifacts({
    ids: results.ids,
    content: results.content,
  });
  spinner.success(`${results.ids.length} icons processed`);
  console.table(artifacts);
  const errorMessage = results.errors.reduce((acc, error) => {
    acc += `${colors.redBright(error)}\n`;
    return acc;
  }, '');
  if (errorMessage.length > 0) {
    console.log(errorMessage);
  }
  if (config.showPerformance) {
    console.log(timeMeasurer.print());
  }
};
