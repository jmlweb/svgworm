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
  console.time('buildSources');
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
  console.timeEnd('buildSources');
};

export default appAction;
