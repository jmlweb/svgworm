import fs from 'node:fs/promises';
import path from 'node:path';

import CachedTransformer from './cached-transformer';
import Transformer from './transformer';

const CHUNK_SIZE = 50;

const SpriteBuilder = async (srcPath: string, force: boolean) => {
  const transformer = await (force ? Transformer : CachedTransformer)();

  return async (items: [id: string, filePath: string][]) => {
    const results: {
      data: string[];
      errors: [filePath: string, error: string][];
      content: string;
    } = {
      data: [],
      errors: [],
      content: '',
    };

    const runBatch = async () => {
      const chunk = items.splice(0, CHUNK_SIZE);
      if (chunk.length === 0) {
        return results;
      }
      const promises = chunk.map(async ([id, filePath]) => {
        try {
          const fileContent = await fs.readFile(
            path.join(srcPath, filePath),
            'utf-8',
          );
          const newContent = await transformer(id, fileContent);
          console.log(newContent);
          results.content += newContent;
          results.data.push(id);
        } catch (error) {
          results.errors.push([
            filePath,
            error instanceof Error ? error.message : 'Unknown error',
          ]);
        }
      });
      await Promise.all(promises);
      return runBatch();
    };

    return runBatch();
  };
};

export default SpriteBuilder;
