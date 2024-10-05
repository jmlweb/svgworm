import { loadConfig as loadSVGOConfig } from 'svgo';

import loadAppConfig from './load-app-config';
import resolvePaths from './resolve-paths';

const loadConfig = async (options: Parameters<typeof loadAppConfig>[0]) => {
  const [appConfig, svgoConfig] = await Promise.all([
    loadAppConfig(options),
    loadSVGOConfig().catch(() => null),
  ]);
  const paths = await resolvePaths({
    src: appConfig.src,
    dest: appConfig.dest,
    clean: appConfig.clean,
  });
  return {
    appConfig,
    paths,
    svgoConfig,
  };
};

export default loadConfig;
