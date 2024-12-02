import fs from 'node:fs/promises';
import path from 'node:path';

import { cosmiconfig } from 'cosmiconfig';
import * as prettier from 'prettier';

import { PrettyError } from '../errors';
import { Result } from '../types';
import { Write } from './types';
import writeIcon from './write-icon';
import writeIndex from './write-index';
import writeSprite from './write-sprite';
import writeTypes from './write-types';

const loadPrettierConfig = async () => {
  const explorer = cosmiconfig('prettier', {
    searchStrategy: 'project',
  });
  const result = await explorer.search().catch(() => ({ config: {} }));
  return result?.config ?? {};
};

const DEFAULT_CONFIG: prettier.Options = {
  endOfLine: 'lf',
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
};

const Writer = (destPath: string) => {
  const finalConfigPromise = loadPrettierConfig().then((config) => ({
    ...DEFAULT_CONFIG,
    ...config,
    parser: 'typescript',
  }));
  const writeFormattedContent: Write = async (content, fileName) => {
    try {
      const template = await prettier.format(content, await finalConfigPromise);
      await fs.writeFile(path.join(destPath, fileName), template);
    } catch (error) {
      throw new PrettyError(
        `There was a problem writing ${fileName}: ${error instanceof Error ? error.message : error}`,
      );
    }
  };
  return (results: Result[]) =>
    Promise.all([
      writeTypes(writeFormattedContent, results),
      writeSprite(writeFormattedContent, results),
      writeIcon(writeFormattedContent),
      writeIndex(writeFormattedContent),
    ]);
};

export default Writer;
