import { htmlToJsx } from 'html-to-jsx-transform';
import { optimize, PluginConfig } from 'svgo';

import { Config } from '../config/schemas';
import { PrettyError } from '../errors/pretty-error';
import { timeMeasurer } from '../shared/time-measurer';

export const IconFormatter = ({
  mode,
  color,
  prefix,
}: Pick<Config, 'mode' | 'color' | 'prefix'>) => {
  const fillAttribute = color ? [] : [{ fill: 'currentColor' }];

  const resolvePrefix = prefix
    ? (id: string) => `${prefix}.${id}`
    : (id: string) => id;

  const basePlugins: PluginConfig[] = [
    'preset-default',
    'removeDimensions',
    'reusePaths',
    'removeXMLNS',
    'removeXlink',
    'sortAttrs',
    'sortDefsChildren',
  ];

  const optimizeContent = (id: string, content: string) => {
    const idWithPrefix = resolvePrefix(id);
    const plugins: PluginConfig[] = [
      ...basePlugins,
      {
        name: 'prefixIds',
        params: {
          prefix: (args) => `${idWithPrefix.replace(/\./g, '-')}_${args.name}`,
          delim: '_',
        },
      },
      {
        name: 'convertColors',
        params: {
          currentColor: !color,
        },
      },
      {
        name: 'addAttributesToSVGElement',
        params: {
          attributes: [{ id: idWithPrefix }, ...fillAttribute],
        },
      },
    ];

    try {
      return optimize(content, {
        path: '1.svg',
        multipass: true,
        plugins,
      }).data;
    } catch (error) {
      throw PrettyError.of(
        error,
        `There was an error optimizing the SVG with ID ${id}`,
      );
    }
  };

  return (id: string, content: string) => {
    const stopMeasuring = timeMeasurer.start('formatIcon');
    const optimizedContent = optimizeContent(id, content);
    const result = (
      mode === 'component' ? htmlToJsx(optimizedContent) : optimizedContent
    )
      .replace('<svg', '<symbol')
      .replace('</svg', '</symbol');
    stopMeasuring();
    return result;
  };
};
