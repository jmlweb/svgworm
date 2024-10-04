import { cosmiconfig } from 'cosmiconfig';
import * as prettier from 'prettier';

const DEFAULT_CONFIG: prettier.Options = {
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
  return result?.config ?? {};
};

let config: Awaited<ReturnType<typeof loadPrettierConfig>> | null = null;

const PrettierFormatter = () => {
  const format = async (
    template: string,
    options: prettier.Options & {
      parser: NonNullable<prettier.Options['parser']>;
    },
  ) => {
    if (!config) {
      config = await loadPrettierConfig();
    }
    return prettier.format(template, {
      ...options,
      ...config,
      parser: options.parser,
    });
  };

  return {
    formatSVG: (template: string) =>
      format(template, { ...DEFAULT_CONFIG, parser: 'html' }),
    formatTS: (template: string) =>
      format(template, { ...DEFAULT_CONFIG, parser: 'typescript' }),
  };
};

export default PrettierFormatter;
