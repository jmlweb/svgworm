import { cosmiconfig } from 'cosmiconfig';
import type { Options } from 'prettier';

import { PrettyError } from '../errors';

const DEFAULT_CONFIG: Options = {
  endOfLine: 'lf',
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
};

const loadPrettierConfig = async () => {
  try {
    const explorer = cosmiconfig('prettier', {
      searchStrategy: 'project',
    });
    const result = await explorer.search().catch(() => ({ config: {} }));
    const fileConfig = result?.config ?? {};
    return {
      ...DEFAULT_CONFIG,
      ...fileConfig,
    };
  } catch (error) {
    throw new PrettyError(
      `Failed to load prettier config: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
};

export default loadPrettierConfig;
