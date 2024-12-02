import { createHash } from 'node:crypto';

import { Config, optimize } from 'svgo';

import { PrettyError } from './errors';

const svgOptimizer = (
  content: string,
  id: string,
  customConfig: Config | null,
) => {
  const hasFillOrStroke =
    content.includes('fill="') || content.includes('stroke="');
  const config: Config = {
    ...customConfig,
    path: '1.svg', // recommended
    multipass: true, // all other config fields are available here
    plugins: [
      'preset-default',
      'removeDimensions',
      'reusePaths',
      'removeXMLNS',
      'removeXlink',
      {
        name: 'prefixIds',
        params: {
          prefix: (args) =>
            `sw_${createHash('md5').update(JSON.stringify(args)).digest('hex')}`,
          delim: '_',
        },
      },
      {
        name: 'convertColors',
        params: {
          currentColor: true,
        },
      },
      {
        name: 'addAttributesToSVGElement',
        params: {
          attributes: [
            {
              id,
            },
            ...(hasFillOrStroke ? [] : [{ fill: 'currentColor' }]),
          ],
        },
      },
      'sortAttrs',
      'sortDefsChildren',
    ],
  };
  try {
    const optimized = optimize(content, config);
    return optimized.data;
  } catch (error) {
    throw new PrettyError(
      `There was an error optimizing the SVG ${id}: ${error}`,
    );
  }
};

export default svgOptimizer;
