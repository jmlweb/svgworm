import { createHash } from 'node:crypto';

import { Config, optimize } from 'svgo';

import { PrettyError } from './errors';

type Optimize = (id: string, content: string) => string;

type Plugin = NonNullable<Config['plugins']>[number];

const prefixIdsPlugin = (id: string): Plugin => ({
  name: 'prefixIds',
  params: {
    prefix: (args) =>
      `sw_${id}_${createHash('md5').update(JSON.stringify(args)).digest('hex')}`,
    delim: '_',
  },
});

const addSVGAttributesPlugin = (
  id: string,
  hasFillOrStroke: boolean,
): Plugin => ({
  name: 'addAttributesToSVGElement',
  params: {
    attributes: [
      {
        id,
      },
      ...(hasFillOrStroke ? [] : [{ fill: 'currentColor' }]),
    ],
  },
});

const guardedOptimize = (...args: Parameters<typeof optimize>) => {
  try {
    return optimize(...args);
  } catch (error) {
    throw new PrettyError(
      `There was an error processing the SVG file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
};

const disabledSVGOptimizer: Optimize = (id, content) =>
  guardedOptimize(content, {
    path: '1.svg', // recommended
    plugins: [prefixIdsPlugin(id), addSVGAttributesPlugin(id, false)],
  }).data;

const EnabledSVGOptimizer =
  (svgoConfig: Config): Optimize =>
  (id, content) => {
    const hasFillOrStroke =
      content.includes('fill="') || content.includes('stroke="');
    return guardedOptimize(content, {
      ...svgoConfig,
      path: '1.svg', // recommended
      multipass: true, // all other config fields are available here
      plugins: [
        'preset-default',
        'removeDimensions',
        'reusePaths',
        'removeXMLNS',
        'removeXlink',
        prefixIdsPlugin(id),
        {
          name: 'convertColors',
          params: {
            currentColor: true,
          },
        },
        addSVGAttributesPlugin(id, hasFillOrStroke),
        'sortAttrs',
        'sortDefsChildren',
      ],
    }).data;
  };

const SVGOptimizer = (enableOptimizations: boolean, svgoConfig: Config) =>
  enableOptimizations ? EnabledSVGOptimizer(svgoConfig) : disabledSVGOptimizer;

export default SVGOptimizer;
