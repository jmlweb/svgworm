import { Write } from './types';

const writeIndex = (write: Write) =>
  write(
    `
    export type { IconProps } from './icon';
    export { default as Icon } from './icon';
    export { default as Sprite } from './sprite';
    export type { Families, IconNameProps, IconNames } from './types';
  `,
    'index.ts',
  );

export default writeIndex;
