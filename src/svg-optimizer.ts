import { createHash } from 'node:crypto';

import { Config, optimize } from 'svgo';

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
  return optimize(content, config);
};

export default svgOptimizer;
