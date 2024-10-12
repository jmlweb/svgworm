import { Config, loadConfig, optimize } from 'svgo';

import { PrettyError } from '../errors';

const SVGOptimizer = () => {
  const svgoConfigPromise = loadConfig().catch(() => null);

  return async ({ id, content }: { id: string; content: string }) => {
    const hasFillOrStroke =
      content.includes('fill="') || content.includes('stroke="');
    const config: Config = {
      ...(await svgoConfigPromise),
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
              `${id}_${JSON.stringify(args).replace(/[^a-z0-9]/gi, '_')}`,
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
      return optimize(content, config).data;
    } catch (error) {
      throw new PrettyError(
        `There was an error optimizing the SVG ${id}: ${error}`,
      );
    }
  };
};

export default SVGOptimizer;
