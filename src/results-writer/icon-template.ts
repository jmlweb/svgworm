const iconTemplate = (prefix?: string) => {
  const parsedId = prefix ? `${prefix.toLowerCase()}.` : undefined;
  return `
    import { ComponentProps } from 'react';

    import { ${prefix}IconFamilies, ${prefix}IconNameProps } from './types';

    export type ${prefix}IconProps<F extends ${prefix}IconFamilies | undefined> = Omit<
      ComponentProps<'svg'>,
      keyof ${prefix}IconNameProps<F>
    > &
      ${prefix}IconNameProps<F>;

    const ${prefix}Icon = <F extends ${prefix}IconFamilies | undefined = undefined>({
      family,
      name,
      width = 24,
      height = 24,
      ...rest
    }: ${prefix}IconProps<F>) => {
      const resolvedName = family ? \`${parsedId}\${family}.\${name}\` : ${parsedId?.length ? `\`${parsedId}\${name}\`` : 'name'};
      return (
        <svg {...rest} width={width} height={height}>
          <use href={\`#\${resolvedName}\`} />
        </svg>
      );
    };

    export default ${prefix}Icon;
  `;
};

export default iconTemplate;
