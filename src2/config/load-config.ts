import { loadConfig as loadSVGOConfig } from 'svgo';

import loadAppConfig from './load-app-config';
import loadPrettierConfig from './load-prettier-config';

const loadConfig = (cliOptions: Parameters<typeof loadAppConfig>[0]) =>
  Promise.all([
    loadAppConfig(cliOptions),
    loadPrettierConfig(),
    loadSVGOConfig(),
  ]);

export default loadConfig;
