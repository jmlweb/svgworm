import * as prettier from 'prettier';

const DEFAULT_CONFIG: prettier.Options = {
  endOfLine: 'lf',
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PrettierFormatter = (config: any) => {
  const format = async (
    template: string,
    options: prettier.Options & {
      parser: NonNullable<prettier.Options['parser']>;
    },
  ) => {
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
