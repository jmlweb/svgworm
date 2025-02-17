import { Options } from 'prettier';

export type FormatFn = (
  content: string,
  extraOptions?: Options,
) => Promise<string>;
