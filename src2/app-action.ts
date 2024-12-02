import path from 'node:path';

import pc from 'picocolors';

import buildSources from './build-sources';
import { PrettyError } from './errors';
import loadConfig from './load-config';
import { AppAction } from './types';
import { Writer } from './writer';

const appAction: AppAction = async (src, dest, options) => {
  const startTime = performance.now();
  console.log(pc.yellow('Starting the SVG processing...'));
  const { paths, svgoConfig } = await loadConfig({
    src,
    dest,
    optimize: options?.optimize,
    clean: options?.clean,
  });
  const writeResults = Writer(paths.dest);
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
  await writeResults(sources.results);
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
