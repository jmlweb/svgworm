import { Config, optimize } from 'svgo';

import loadSvgoConfig from '../config/load-svgo-config';
import { PrettyError } from '../errors';
import md5 from '../md5/md5';

type Plugin = NonNullable<Config['plugins']>[number];

const extractFillAndStrokeValues = (svgString: string): string[] => {
  // Crear un conjunto para almacenar valores únicos de "fill" y "stroke"
  const values = new Set<string>();

  // Usar una expresión regular para buscar atributos "fill" y "stroke"
  const regex = /\s(?:fill|stroke)="(.*?)"/g;
  let match: RegExpExecArray | null;

  // Iterar sobre los matches
  while ((match = regex.exec(svgString)) !== null) {
    const value = match[1];
    // Agregar al conjunto si el valor no es "none"
    if (
      value &&
      value !== 'none' &&
      value !== 'currentColor' &&
      value !== 'inherit' &&
      value !== '#fff' &&
      value !== '#ffffff' &&
      value !== '#424242'
    ) {
      values.add(value);
    }
  }

  // Convertir el conjunto en un arreglo y retornarlo
  return Array.from(values);
};

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
    const fillAndStrokeValues = extractFillAndStrokeValues(content);

    const hasFillOrStroke = fillAndStrokeValues.length > 0;

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
              currentColor: fillAndStrokeValues.length < 2,
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
