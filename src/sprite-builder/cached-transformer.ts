import fs from 'node:fs/promises';
import path from 'node:path';

import md5 from '../md5/md5';
import getCacheDir from './get-cache-dir';
import Transformer from './transformer';

const fileExists = (filePath: string) =>
  fs
    .access(filePath, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);

const CachedTransformer = async () => {
  const [cacheDir, transformer] = await Promise.all([
    getCacheDir(),
    Transformer(),
  ]);

  return async (id: string, content: string) => {
    const fileHash = md5(`${md5(id)}${md5(content)}`);
    const filePath = path.resolve(cacheDir, fileHash);
    if (!(await fileExists(filePath))) {
      try {
        const transformedContent = transformer(id, content);
        fs.writeFile(filePath, transformedContent);
        return transformedContent;
      } catch (error) {
        throw new Error(
          `There was a problem caching the transformed file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      return fileContent;
    } catch (error) {
      throw new Error(
        `There was a problem reading the cached file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  };
};

export default CachedTransformer;
