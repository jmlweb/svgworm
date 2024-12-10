const indexTemplate = (prefix?: string) => `
    export type { ${prefix}IconProps } from './icon';
    export { default as ${prefix}Icon } from './icon';
    export type { ${prefix}IconFamilies, ${prefix}IconNameProps, ${prefix}IconNames } from './types';
  `;

export default indexTemplate;
