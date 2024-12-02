import { fdir } from 'fdir';
import fs from 'fs/promises';

import IdGenerator from './id-generator';
import SVGOptimizer from './svg-optimizer';

const Processor = () => {
  const svgOptimizer = SVGOptimizer();
  const generateId = IdGenerator();
  return async (srcPath: string) => {
    const api = new fdir()
      .withRelativePaths()
      .glob('./**/*.svg')
      .crawl(srcPath);
    const files = api.sync();
    return Promise.all(
      files.map(async (file: string) => {
        const id = generateId(file);
        try {
          const content = await fs.readFile(file, 'utf-8');
          const optimized = await svgOptimizer({ id, content });
          return {
            id,
            content: optimized,
            file,
          };
        } catch (error) {
          return {
            id,
            error: error instanceof Error ? error.message : 'Unknown error',
            file,
          };
        }
      }),
    ).then((resultsArr) =>
      resultsArr.reduce(
        (acc, curr) => {
          if (typeof curr.error !== 'undefined') {
            acc.errors.push(curr);
          } else {
            acc.data.push(curr);
          }
          return acc;
        },
        {
          data: [] as {
            id: string;
            content: string;
            file: string;
          }[],
          errors: [] as {
            id: string;
            error: string;
            file: string;
          }[],
        },
      ),
    );
  };
};

export default Processor;
