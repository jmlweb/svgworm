import fs from 'node:fs/promises';

import { Formatter } from './types';

const writeIndex = async (destPath: string, formatter: Formatter) => {
  const template = await formatter.formatTS(`
    export type { IconProps } from './icon';
    export { default as Icon } from './icon';
    export { default as Sprite } from './sprite';
    export type { Families, IconNameProps, IconNames } from './types';
  `);
  await fs.writeFile(`${destPath}/index.ts`, template);
};

export default writeIndex;
