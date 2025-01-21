import fs from 'node:fs/promises';
import path from 'node:path';

import { Config } from '../config/schemas';
import { capitalize } from '../shared/capitalize';
import { FormatFn } from './types';

const buildFileIconFileName = ({
  prefix,
  extension,
}: {
  prefix?: string;
  extension: string;
}) => `${prefix ? `${prefix}-` : ''}icon.${extension}`;

const iconTemplate = ({
  iconName,
  prefix,
  isTS,
}: {
  iconName: string;
  prefix?: string;
  isTS: boolean;
}) => {
  const formattedPrefix = prefix ? `${prefix}.` : '';
  const typePrefix = prefix ? `${prefix}-` : '';

  const baseTemplate = `
    <svg {...rest} width={width} height={height}>
      <use href={\`#${formattedPrefix}\${name}\`} />
    </svg>
  `;

  if (!isTS) {
    return `
  export const ${iconName} = ({ 
    name,
    width = 24,
    height = 24,
    ...rest 
  }) => {
    return (${baseTemplate});
  };
`;
  }

  return `
  import type { ComponentProps } from 'react';
  import type { ${iconName}Name } from './${typePrefix}types'; 

  export interface ${iconName}Props extends ComponentProps<'svg'> {
    name: ${iconName}Name;
  };

  export const ${iconName} = ({ name, width = 24, height = 24, ...rest }: ${iconName}Props) => (${baseTemplate});
`;
};

export const writeIcon = async ({
  config,
  destPath,
  format,
}: {
  config: Pick<Config, 'prefix' | 'ts'>;
  destPath: string;
  format: FormatFn;
}) => {
  const iconName = config.prefix ? `${capitalize(config.prefix)}Icon` : 'Icon';
  const extension = config.ts ? 'tsx' : 'jsx';
  const fileName = buildFileIconFileName({ prefix: config.prefix, extension });

  const formatted = await format(
    iconTemplate({ iconName, prefix: config.prefix, isTS: config.ts }),
    { parser: config.ts ? 'typescript' : 'babel' },
  );

  return fs.writeFile(path.join(destPath, fileName), formatted);
};
