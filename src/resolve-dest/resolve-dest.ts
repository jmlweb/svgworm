import fs from 'node:fs/promises';
import path from 'node:path';

import { fdir } from 'fdir';

import { ResolvedOptions } from '../config/load-app-config';
import { PrettyError } from '../errors';

const api = new fdir()
  .withRelativePaths()
  .glob('index.ts', 'icon.tsx', 'sprite.tsx', 'types.ts');

const resolveDest = async ({
  clean,
  dest,
}: Pick<ResolvedOptions, 'clean' | 'dest'>) => {
  const destPath = path.resolve(process.cwd(), dest);

  const destExists = await fs
    .access(destPath)
    .then(() => true)
    .catch(() => false);

  if (!destExists) {
    try {
      await fs.mkdir(destPath, { recursive: true });
    } catch (error) {
      throw new PrettyError(
        `The destination directory could not be created: ${destPath}. ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  } else if (clean) {
    try {
      const files = api.crawl(destPath).sync();
      await Promise.all(
        files.map(async (file) => fs.unlink(path.join(destPath, file))),
      );
    } catch (error) {
      throw new PrettyError(
        `There was a problem cleaning the destination directory: ${destPath}. ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  return destPath;
};

export default resolveDest;
