import fs from 'node:fs/promises';
import path from 'node:path';

import { Config } from '../config/schemas';
import { capitalize } from '../shared/capitalize';
import { FormatFn } from './types';

const generateTSUnionString = (items: string[]) =>
  items.map((v) => `'${v}'`).join(' | ');

const typesTemplate = ({
  iconName,
  ids,
}: {
  iconName: string;
  ids: string[];
}) => `
  export type ${iconName}Name = ${generateTSUnionString(ids)};
`;

export const writeTypes = async ({
  config,
  destPath,
  format,
  ids,
}: {
  config: Pick<Config, 'prefix'>;
  destPath: string;
  format: FormatFn;
  ids: string[];
}) => {
  const fileName = config.prefix ? `${config.prefix}-types` : 'types';
  return fs.writeFile(
    path.join(destPath, `${fileName}.ts`),
    await format(
      typesTemplate({
        iconName: config.prefix ? `${capitalize(config.prefix)}Icon` : 'Icon',
        ids,
      }),
    ),
  );
};
