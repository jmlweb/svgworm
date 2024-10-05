import path from 'node:path';

import pc from 'picocolors';

import buildSources from './build-sources';
import { PrettyError } from './errors';
import loadConfig from './load-config';
import PrettierFormatter from './prettier-formatter';
import { AppAction } from './types';
import writeIcon from './write-icon';
import writeIndex from './write-index';
import writeSprite from './write-sprite';
import writeTypes from './write-types';

const appAction: AppAction = async (src, dest, options) => {
  const startTime = performance.now();
  console.log(pc.yellow('Starting the SVG processing...'));
  const { paths, prettierConfig, svgoConfig } = await loadConfig({
    src,
    dest,
    optimize: options?.optimize,
    clean: options?.clean,
  });
  console.log(pc.blueBright(`Processing SVG files from ${pc.bold(paths.src)}`));

  const sources = await buildSources(
    paths.src,
    svgoConfig,
    options?.force || false,
  );
  if (!sources.results.length) {
    console.table(sources.errors);
    throw new PrettyError(
      'There were no valid SVG files found in the source directory.',
    );
  }
  const formatter = PrettierFormatter(prettierConfig);
  await Promise.all([
    writeTypes(sources.results, paths.dest, formatter),
    writeSprite(sources.results, paths.dest, formatter),
    writeIcon(paths.dest, formatter),
    writeIndex(paths.dest, formatter),
  ]);
  const endTime = performance.now();
  console.log(
    `${pc.greenBright(
      `${pc.bold(sources.results.length)} SVG files processed in ${pc.bold((endTime - startTime).toFixed(2))}ms`,
    )}\n`,
  );
  console.log(
    pc.black(
      pc.bgWhite(`
Generated files:
- ${path.join(paths.dest, 'index.ts')}
- ${path.join(paths.dest, 'sprite.tsx')}
- ${path.join(paths.dest, 'icon.tsx')}
- ${path.join(paths.dest, 'types.ts')}`),
    ),
  );
  if (sources.errors.length) {
    console.table(sources.errors);
  }
};

export default appAction;
