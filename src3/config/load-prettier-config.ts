import { cosmiconfig } from 'cosmiconfig';
import type { Options } from 'prettier';

const DEFAULT_CONFIG: Options = {
  endOfLine: 'lf',
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
};

const loadPrettierConfig = async () => {
  const explorer = cosmiconfig('prettier', {
    searchStrategy: 'project',
  });
  const result = await explorer.search().catch(() => ({ config: {} }));
  const fileConfig = result?.config ?? {};
  return {
    ...DEFAULT_CONFIG,
    ...fileConfig,
  };
};

export default loadPrettierConfig;
