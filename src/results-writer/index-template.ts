const indexTemplate = () => `
    export type { IconProps } from './icon';
    export { default as Icon } from './icon';
    export { default as Sprite } from './sprite';
    export type { Families, IconNameProps, IconNames } from './types';
  `;

export default indexTemplate;
