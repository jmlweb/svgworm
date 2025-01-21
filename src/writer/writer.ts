import { Config } from '../config/schemas';
import { Formatter } from './formatter';
import { resolveDestDirectory } from './resolve-dest-directory';
import { writeIcon } from './write-icon';
import { WriteSprite } from './write-sprite';
import { writeTypes } from './write-types';

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
    const promises = [
      writeSprite(content),
      writeIcon({ config, destPath, format }),
    ];
    if (config.ts) {
      promises.push(writeTypes({ config, destPath, format, ids }));
    }
    return Promise.all(promises);
  };
};
