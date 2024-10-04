import pc from 'picocolors';

import buildSources from './build-sources';
import { PrettyError } from './errors';
import loadConfig from './load-config';
import PrettierFormatter from './prettier-formatter';
import SVGOptimizer from './svg-optimizer';
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
  console.log(
    pc.blueBright(`Processing SVG files inside ${pc.bold(paths.src)}`),
  );
  const sources = await buildSources(paths.src, SVGOptimizer(svgoConfig));
  if (!sources.results.length) {
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
- ${paths.dest}/index.ts
- ${paths.dest}/sprite.tsx
- ${paths.dest}/icon.tsx
- ${paths.dest}/types.ts`),
    ),
  );
};

export default appAction;
