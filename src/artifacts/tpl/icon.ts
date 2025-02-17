const removeExtension = (fileName: string) => fileName.replace(/\.[^.]+$/, '');

export const iconTpl = ({
  capitalizedIconName,
  ts,
  url,
  typesFileName,
  prefix,
}: {
  capitalizedIconName: string;
  ts: boolean;
  url?: string;
  typesFileName: string;
  prefix?: string;
}) => {
  const dottedPrefix = prefix ? `${prefix}.` : '';
  const hrefPrefix = `${url ? url : ''}#${dottedPrefix}`;
  const hrefAttribute = `${url ? 'xlinkHref' : 'href'}={\`${hrefPrefix}\${name}\`}`;

  const iconContentBase = `
    <svg {...rest} width={width} height={height}>
      <use ${hrefAttribute} />
    </svg>
  `;

  let result = '';

  if (ts) {
    result += `
      import type { ComponentProps } from 'react';
      import type { ${capitalizedIconName}Name } from './${removeExtension(typesFileName)}';

      export interface ${capitalizedIconName}Props extends Omit<ComponentProps<'svg'>, 'name'> {
        name: ${capitalizedIconName}Name;
      };
    `;
  }

  result += `
    export const ${capitalizedIconName} = ({ name, width = 24, height = 24, ...rest }${ts ? `: ${capitalizedIconName}Props` : ''}) => (${iconContentBase});
  `;

  return result;
};
