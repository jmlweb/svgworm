import { Config } from '../config/schemas';
import { md5 } from '../shared/md5';
import { Formatter } from './formatter';
import { resolveDestDirectory } from './resolve-dest-directory';
import { writeIcon } from './write-icon';
import { WriteSprite } from './write-sprite';
import { writeTypes } from './write-types';

const buildSpriteFileName = (
  { prefix, mode, ts }: Pick<Config, 'mode' | 'prefix' | 'ts'>,
  content: string,
) => {
  if (mode === 'file') {
    const fileHash = md5(content);
    return `${prefix ? `${prefix}-` : ''}sprite.${fileHash}.svg`;
  } else {
    return `${prefix ? `${prefix}-` : ''}sprite.${ts ? 'tsx' : 'jsx'}`;
  }
};

export const Writer = ({
  config,
  destPath,
}: {
  config: Pick<Config, 'mode' | 'prefix' | 'ts'>;
  destPath: string;
}) => {
  const format = Formatter();
  const resolveDestP = resolveDestDirectory(destPath);
  const writeSprite = WriteSprite({ config, destPath, format });

  return async ({ ids, content }: { ids: string[]; content: string }) => {
    await resolveDestP;
    const spriteFileName = buildSpriteFileName(config, content);
    const promises = [
      writeSprite(content, spriteFileName),
      writeIcon({ config, destPath, format, spriteFileName }),
    ];
    if (config.ts) {
      promises.push(writeTypes({ config, destPath, format, ids }));
    }
    return Promise.all(promises);
  };
};
