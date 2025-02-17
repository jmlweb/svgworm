import fs from 'node:fs/promises';
import path from 'node:path';

import { Config } from '../config/schemas';
import { capitalize } from '../shared/capitalize';
import { md5 } from '../shared/md5';
import { Formatter } from './formatter';
import { resolveDestDirectory } from './resolve-dest-directory';
import { iconTpl } from './tpl/icon';
import { spriteTpl } from './tpl/sprite';
import { typesTpl } from './tpl/types';

export const ArtifactsResolver = ({
  config: { mode, prefix, ts, baseUrl },
  destPath,
}: {
  config: Config;
  destPath: string;
}) => {
  const dashedPrefix = prefix ? `${prefix}-` : '';
  const format = Formatter();
  const resolveDestP = resolveDestDirectory(destPath);
  const capitalizedPrefix = prefix ? capitalize(prefix) : '';

  const getSpriteFileName = (content: string) => {
    const initialPart = `${dashedPrefix}sprite`;
    if (mode === 'file') {
      const fileHash = md5(content);
      return `${initialPart}.${fileHash}.svg`;
    } else {
      const fileExtension = ts ? 'tsx' : 'jsx';
      return `${initialPart}.${fileExtension}`;
    }
  };

  return async ({ ids, content }: { ids: string[]; content: string }) => {
    const fileNames = {
      iconNames: `${dashedPrefix}icon-names.json`,
      icon: `${dashedPrefix}icon.${ts ? 'tsx' : 'jsx'}`,
      types: `${dashedPrefix}types.ts`,
      sprite: getSpriteFileName(content),
      info: `${dashedPrefix}info.json`,
    };

    const paths = {
      iconNames: path.join(destPath, fileNames.iconNames),
      icon: path.join(destPath, fileNames.icon),
      types: path.join(destPath, fileNames.types),
      sprite: path.join(destPath, fileNames.sprite),
      info: path.join(destPath, fileNames.info),
    };

    const [
      iconNamesContent,
      infoContent,
      spriteContent,
      iconContent,
      typesContent,
    ] = await Promise.all([
      format(JSON.stringify(ids), {
        parser: 'json',
      }),
      format(
        JSON.stringify({
          fileNames,
          paths,
        }),
        { parser: 'json' },
      ),
      format(
        spriteTpl({
          content,
          mode,
          capitalizedIconName: `${capitalizedPrefix}Icon`,
        }),
        mode === 'file' ? { parser: 'html', width: 120 } : undefined,
      ),
      format(
        iconTpl({
          capitalizedIconName: `${capitalizedPrefix}Icon`,
          ts,
          typesFileName: fileNames.types,
          prefix,
          url: `${baseUrl}/${fileNames.sprite}`,
        }),
      ),
      ts
        ? format(
            typesTpl({
              ids,
              capitalizedIconName: `${capitalizedPrefix}Icon`,
            }),
          )
        : null,
      resolveDestP,
    ]);

    await Promise.all([
      fs.writeFile(paths.iconNames, iconNamesContent),
      fs.writeFile(paths.info, infoContent),
      fs.writeFile(paths.sprite, spriteContent),
      fs.writeFile(paths.icon, iconContent),
      typesContent ? fs.writeFile(paths.types, typesContent) : null,
    ]);

    return paths;
  };
};
