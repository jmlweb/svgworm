import fs from 'node:fs/promises';
import path from 'node:path';

import CachedTransformer from './cached-transformer';
import Transformer from './transformer';

const CHUNK_SIZE = 10;

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
            path.resolve(srcPath, filePath),
            'utf-8',
          );
          results.content += await transformer(id, fileContent);
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
