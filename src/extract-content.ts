import fs from 'fs/promises';
import { htmlToJsx } from 'html-to-jsx-transform';
import { optimize, PluginConfig } from 'svgo';
import { HTMLElement, parse } from 'node-html-parser';

export const extractContent = async (id: string, filePath: string) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    if (content.length === 0) {
      throw new Error('File is empty');
    }
    const result = optimize(content, {
      path: filePath, // recommended
      multipass: true, // all other config fields are available here
      js2svg: {
        indent: 4, // number
        pretty: false, // boolean
      },
      plugins: [
        'preset-default',
        'removeUnknownsAndDefaults',
        'collapseGroups',
        'convertPathData',
        'removeDesc',
        'removeUselessStrokeAndFill',
        'removeDimensions',
        {
          name: 'convertColors',
          params: {
            currentColor: true,
          },
        }
      ],
    });
    if (!result.data) {
      // return content;
      throw new Error('No data returned');
    }
    const parsedSVG = parse(result.data).querySelector('svg') as HTMLElement;
    parsedSVG.removeAttribute('xmlns');
    const symbolElement = parse('<symbol />').querySelector('symbol') as HTMLElement;
    parsedSVG.childNodes.forEach((child) => {
      symbolElement.appendChild(child);
    });
    symbolElement.setAttributes({
      id,
      ...parsedSVG.attributes,
    });
    return htmlToJsx(symbolElement.toString());
  } catch (error) {
    let message = `There was a problem generating sprite with id "${id}"`;
    if (error instanceof Error) {
      message = `${message}: ${error.message}`;
    }
    throw new Error(message);
  }
};
