import fs from 'node:fs/promises';
import path from 'node:path';

import CachedTransformer from './cached-transformer';
import Transformer from './transformer';

const CHUNK_SIZE = 10;

const template = (content: string) => `
    const Sprite = () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="0" height="0">
        ${content}
      </svg>
    );
    
    export default Sprite;
  `;

const SpriteBuilder = async (
  force: boolean,
  formatter: (x: string) => Promise<string>,
) => {
  const transformer = await (force ? Transformer : CachedTransformer)();

  return async (
    items: [id: string, filePath: string][],
    srcPath: string,
    destPath: string,
  ) => {
    const results: {
      data: string[];
      errors: [filePath: string, error: string][];
    } = {
      data: [],
      errors: [],
    };
    let content = '';

    const runBatch = async () => {
      const chunk = items.splice(0, CHUNK_SIZE);
      if (chunk.length === 0) {
        await fs.writeFile(
          path.resolve(destPath, 'Sprite.tsx'),
          await formatter(template(content)),
          'utf-8',
        );
        return results;
      }
      const promises = chunk.map(async ([id, filePath]) => {
        try {
          const fileContent = await fs.readFile(
            path.resolve(srcPath, filePath),
            'utf-8',
          );
          content += await transformer(id, fileContent);
          results.data.push(id);
        } catch (error) {
          results.errors.push([
            filePath,
            error instanceof Error ? error.message : 'Unknown error',
          ]);
        }
      });
      await Promise.all(promises);
      return await runBatch();
    };

    return await runBatch();
  };
};

export default SpriteBuilder;
