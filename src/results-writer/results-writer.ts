import fs from 'node:fs/promises';
import path from 'node:path';

import { PrettyError } from '../errors';
import iconTemplate from './icon-template';
import indexTemplate from './index-template';
import spriteTemplate from './sprite-template';
import typesTemplate from './types-template';

const resultsWriter = async ({
  results,
  formatter,
  destPath,
}: {
  results: {
    data: string[];
    content: string;
  };
  formatter: (content: string) => Promise<string>;
  destPath: string;
}) => {
  const writeFormattedContent = async (content: string, fileName: string) => {
    try {
      const formattedContent = await formatter(content);
      await fs.writeFile(path.join(destPath, fileName), formattedContent);
    } catch (error) {
      throw new PrettyError(
        `There was a problem writing ${fileName}: ${error instanceof Error ? error.message : error}`,
      );
    }
  };

  return Promise.all([
    writeFormattedContent(spriteTemplate(results.content), 'sprite.tsx'),
    writeFormattedContent(iconTemplate(), 'icon.tsx'),
    writeFormattedContent(typesTemplate(results.data), 'types.ts'),
    writeFormattedContent(indexTemplate(), 'index.ts'),
  ]);
};

export default resultsWriter;
