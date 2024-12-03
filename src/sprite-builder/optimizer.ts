import { Config, optimize } from 'svgo';

import loadSvgoConfig from '../config/load-svgo-config';
import { PrettyError } from '../errors';
import md5 from '../md5/md5';

type Plugin = NonNullable<Config['plugins']>[number];

const prefixIdsPlugin = (id: string): Plugin => ({
  name: 'prefixIds',
  params: {
    prefix: (args) => `sw_${id}_${md5(JSON.stringify(args))}`,
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

const Optimizer = async () => {
  const svgoConfig = await loadSvgoConfig();

  return (id: string, content: string) => {
    const hasFillOrStroke =
      content.includes('fill="') || content.includes('stroke="');
    try {
      return optimize(content, {
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
    } catch (error) {
      throw new PrettyError(
        `There was an error processing the SVG file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  };
};

export default Optimizer;
