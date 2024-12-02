import { loadConfig } from 'svgo';

import { PrettyError } from '../errors';

const loadSvgoConfig = async () => {
  try {
    return await loadConfig();
  } catch (error) {
    throw new PrettyError(
      `Failed to load svgo config: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
};

export default loadSvgoConfig;
