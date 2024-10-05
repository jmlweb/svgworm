import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import { fdir } from 'fdir';
import os from 'os';
import { Config } from 'svgo';

import getFilesMap from './get-files-map';
import svgOptimizer from './svg-optimizer';

const formatContentWithCache = async ({
  id,
  content,
  tmpDir,
  svgConfig,
  force,
}: {
  id: string;
  content: string;
  tmpDir: string;
  svgConfig: Config | null;
  force: boolean;
}) => {
  const hash = createHash('md5').update(content).digest('hex');
  const tmpFile = path.join(tmpDir, `${hash}.svg`);

  const processFileAndSave = () => {
    const formattedContent = svgOptimizer(content, id, svgConfig);
    if (!formattedContent.data) {
      throw new Error('SVG optimization failed');
    }
    fs.writeFile(tmpFile, formattedContent.data, 'utf8').catch(() => undefined);
    return formattedContent.data;
  };

  if (force) {
    return processFileAndSave();
  }
  try {
    return await fs.readFile(tmpFile, 'utf8');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return processFileAndSave();
  }
};

const buildSources = async (
  srcPath: string,
  svgConfig: Config | null,
  force: boolean,
) => {
  const api = new fdir().withRelativePaths().glob('./**/*.svg').crawl(srcPath);
  const filesMap = getFilesMap(api.sync());
  const tmpDir = os.tmpdir();
  console.log(`Using temporary directory: ${tmpDir}`);
  const sourcesArr = await Promise.all(
    Object.entries(filesMap).map(async ([id, src]) => {
      const content = await fs
        .readFile(path.join(srcPath, src), 'utf8')
        .catch(() => undefined);
      if (!content) {
        return {
          id,
          src,
          error:
            content === undefined ? 'File could not be read' : 'File is empty',
        };
      }
      try {
        const formattedContent = await formatContentWithCache({
          id,
          content,
          tmpDir,
          svgConfig,
          force,
        });
        return {
          id,
          src,
          content: formattedContent,
        };
      } catch (error) {
        return {
          id,
          src,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),
  );
  const sources = sourcesArr.reduce(
    (acc, { id, src, content, error }) => {
      if (error) {
        acc.errors.push({ id, src, error });
      } else if (content) {
        acc.results.push({ id, src, content });
      }
      return acc;
    },
    {
      results: [] as { id: string; src: string; content: string }[],
      errors: [] as { id: string; src: string; error: string }[],
    },
  );
  sources.results.sort((a, b) => a.id.localeCompare(b.id));
  sources.errors.sort((a, b) => a.id.localeCompare(b.id));
  return sources;
};

export default buildSources;
