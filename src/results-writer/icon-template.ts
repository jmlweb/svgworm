const iconTemplate = () => `
    import { ComponentProps } from 'react';

    import { Families, IconNameProps } from './types';

    export type IconProps<F extends Families | undefined> = Omit<
      ComponentProps<'svg'>,
      keyof IconNameProps<F>
    > &
      IconNameProps<F>;

    const Icon = <F extends Families | undefined = undefined>({
      family,
      name,
      width = 24,
      height = 24,
      ...rest
    }: IconProps<F>) => {
      const resolvedName = family ? \`\${family}.\${name}\` : name;
      return (
        <svg {...rest} width={width} height={height}>
          <use href={\`#\${resolvedName}\`} />
        </svg>
      );
    };

    export default Icon;
  `;

export default iconTemplate;
