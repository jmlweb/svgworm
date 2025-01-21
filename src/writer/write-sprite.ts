import fs from 'node:fs/promises';
import path from 'node:path';

import { fdir } from 'fdir';

import { Config } from '../config/schemas';
import { md5 } from '../shared/md5';
import { timeMeasurer } from '../shared/time-measurer';
import { FormatFn } from './types';

const buildFileSpriteFileName = ({
  prefix,
  fileHash,
}: {
  prefix?: string;
  fileHash: string;
}) => `${prefix ? `${prefix}-` : ''}sprite.${fileHash}.svg`;

const resolveCurrentFileSprites = async ({
  config,
  destPath,
}: {
  config: Pick<Config, 'prefix'>;
  destPath: string;
}) => {
  const stopMeasuring = timeMeasurer.start('resolveCurrentFileSprites');
  const fileGlob = buildFileSpriteFileName({
    prefix: config.prefix,
    fileHash: '*',
  });
  const files = await new fdir()
    .withFullPaths()
    .glob(`./**/${fileGlob}`)
    .crawl(destPath)
    .withPromise()
    .catch(() => []);
  stopMeasuring();
  return files;
};

const fileSpriteTemplate = (content: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg"><defs>${content}</defs></svg>`;

const buildComponentSpriteFileName = ({ prefix }: { prefix?: string }) =>
  `${prefix ? `${prefix}-` : ''}sprite.tsx`;

const componentSpriteTemplate = ({
  content,
  prefix = '',
}: {
  content: string;
  prefix?: string;
}) =>
  `export const ${prefix}IconSprite = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style={{ visibility: 'hidden' }}>
    ${content}
  </svg>
);`;

export const WriteSprite = ({
  config,
  destPath,
  format,
}: {
  config: Pick<Config, 'prefix' | 'mode'>;
  destPath: string;
  format: FormatFn;
}) => {
  if (config.mode === 'file') {
    const currentFileSpritesP = resolveCurrentFileSprites({ config, destPath });
    return async (content: string) => {
      const fileHash = md5(content);
      const currentFileSprites = await currentFileSpritesP;
      const newSpriteIndex = currentFileSprites.findIndex((sprite) =>
        sprite.endsWith(`${fileHash}.svg`),
      );

      if (newSpriteIndex === -1) {
        const formattedContent = await format(fileSpriteTemplate(content), {
          parser: 'html',
          width: 120,
        });
        await Promise.all([
          fs.writeFile(
            path.join(
              destPath,
              buildFileSpriteFileName({ prefix: config.prefix, fileHash }),
            ),
            formattedContent,
          ),
          ...currentFileSprites.map((sprite) => fs.unlink(sprite)),
        ]);
      } else {
        currentFileSprites.splice(newSpriteIndex, 1);
        await Promise.all(
          currentFileSprites.map((sprite) => fs.unlink(sprite)),
        );
      }
    };
  }

  return async (content: string) => {
    return fs.writeFile(
      path.join(
        destPath,
        buildComponentSpriteFileName({ prefix: config.prefix }),
      ),
      await format(componentSpriteTemplate({ content, prefix: config.prefix })),
    );
  };
};
