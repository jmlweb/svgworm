import pc from 'picocolors';

import buildSources from './build-sources';
import { PrettyError } from './errors';
import loadConfig from './load-config';
import resolvePaths from './resolve-paths';
import { AppAction } from './types';
import writeIcon from './write-icon';
import writeIndex from './write-index';
import writeSprite from './write-sprite';
import writeTypes from './write-types';

const appAction: AppAction = async (src, dest, options) => {
  const startTime = performance.now();
  const config = await loadConfig({
    src,
    dest,
    optimize: options?.optimize,
    clean: options?.clean,
  });
  const paths = await resolvePaths({
    src: config.src,
    dest: config.dest,
    clean: config.clean,
  });
  console.log(
    pc.blueBright(`Processing SVG files inside ${pc.bold(paths.src)}`),
  );
  // console.time('buildSources');
  const sources = await buildSources(paths.src);
  if (!sources.results.length) {
    throw new PrettyError(
      'There were no valid SVG files found in the source directory.',
    );
  }
  await Promise.all([
    writeTypes(sources.results, paths.dest),
    writeSprite(sources.results, paths.dest),
    writeIcon(paths.dest),
    writeIndex(paths.dest),
  ]);
  const endTime = performance.now();
  // console.timeEnd('buildSources');
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
