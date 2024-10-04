import fs from 'node:fs/promises';
import path from 'node:path';

import { fdir } from 'fdir';

import { PrettyError } from './errors';

const dirExists = (dir: string) =>
  fs
    .access(dir)
    .catch(() => false)
    .then((x) => x ?? true);

/**
 * Resolve the source and destination paths.
 * Ensure the source directory exists and create the destination directory if it doesn't exist.
 * @param src Source directory
 * @param dest Destination directory
 */
const resolvePaths = async ({
  src,
  dest,
  clean,
}: {
  src: string;
  dest: string;
  clean: boolean;
}) => {
  const paths = {
    src: path.resolve(process.cwd(), src),
    dest: path.resolve(process.cwd(), dest),
  };

  const [srcExists, destExists] = await Promise.all(
    Object.values(paths).map(dirExists),
  );

  // Ensure the source directory exists
  if (!srcExists) {
    throw new PrettyError(`The source directory does not exist: ${paths.src}`);
  }

  // Create the destination directory if it doesn't exist
  if (!destExists) {
    try {
      await fs.mkdir(paths.dest, { recursive: true });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new PrettyError(
        `The destination directory could not be created: ${paths.dest}`,
      );
    }
  } else if (clean) {
    try {
      const api = new fdir()
        .withRelativePaths()
        .glob('./index.ts', './icon.tsx', './sprite.tsx', 'types.ts')
        .crawl(paths.dest);
      const files = api.sync();
      await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(paths.dest, file);
          return fs.unlink(filePath);
        }),
      );
    } catch (error) {
      throw new PrettyError(
        `There was a problem cleaning the destination directory: ${paths.dest}\n${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  return paths;
};

export default resolvePaths;
