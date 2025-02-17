import { cosmiconfig } from 'cosmiconfig';
import { format, Options } from 'prettier';

import { FormatFn } from './types';

const DEFAULT_PRETTIER_CONFIG: Options = {
  endOfLine: 'lf',
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  parser: 'typescript',
};

const explorer = cosmiconfig('prettier', {
  searchStrategy: 'project',
});

const loadPrettierConfig = async () => {
  try {
    const result = await explorer.search();
    return {
      ...DEFAULT_PRETTIER_CONFIG,
      ...(result?.config ?? {}),
    };
  } catch {
    return DEFAULT_PRETTIER_CONFIG;
  }
};

export const Formatter = (): FormatFn => {
  // Cache the promise to avoid multiple config loads
  const configPromise = loadPrettierConfig();

  return async (content: string, extraOptions?: Options) => {
    const config = await configPromise;
    return format(content, {
      ...config,
      ...extraOptions,
    });
  };
};
