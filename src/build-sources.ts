import fs from 'node:fs/promises';
import path from 'node:path';

import getFilesMap from './get-files-map';
import SVGOptimizer from './svg-optimizer';

const buildSources = async (
  srcPath: string,
  svgOptimizer: ReturnType<typeof SVGOptimizer>,
) => {
  const files = await fs.readdir(srcPath, { recursive: true });
  const filesMap = getFilesMap(files);
  const rawSources = await Promise.all(
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
        const formattedContent = await new Promise<
          ReturnType<typeof svgOptimizer>
        >((resolve) => {
          setTimeout(() => resolve(svgOptimizer(content, id)), 0);
        });
        if (!formattedContent.data) {
          throw new Error('SVG optimization failed');
        }
        return {
          id,
          src,
          content: formattedContent.data,
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
  return rawSources.reduce(
    (acc, { id, src, content, error }) => {
      if (error) {
        acc.errors.push({ id, src, error });
        acc.errors.sort((a, b) => a.id.localeCompare(b.id));
      } else if (content) {
        acc.results.push({ id, src, content });
        acc.results.sort((a, b) => a.id.localeCompare(b.id));
      }
      return acc;
    },
    {
      results: [] as { id: string; src: string; content: string }[],
      errors: [] as { id: string; src: string; error: string }[],
    },
  );
};

export default buildSources;
