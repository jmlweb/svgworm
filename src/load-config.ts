import { cosmiconfig } from 'cosmiconfig';
import { loadConfig as loadSVGOConfig } from 'svgo';

import loadAppConfig from './load-app-config';
import resolvePaths from './resolve-paths';

const loadPackageConfig = async (packageName: string) => {
  const explorer = cosmiconfig(packageName, {
    searchStrategy: 'project',
  });
  const result = await explorer.search().catch(() => ({ config: {} }));
  return result?.config ?? {};
};

const loadConfig = async (options: Parameters<typeof loadAppConfig>[0]) => {
  const [appConfig, prettierConfig, svgoConfig] = await Promise.all([
    loadAppConfig(options),
    loadPackageConfig('prettier'),
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
    prettierConfig,
    svgoConfig,
  };
};

export default loadConfig;
