import fs from 'node:fs';
import path from 'node:path';

import { ResolvedOptions } from '../config/load-app-config';

interface WormerOptions {
  srcPath: string;
  destPath: string;
  force: ResolvedOptions['force'];
}

const createSpriteStream = (destPath: string) => {
  const spriteStream = fs.createWriteStream(path.join(destPath, 'sprite.tsx'));
  spriteStream.on('open', () => {
    spriteStream.write(`const Sprite = () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="0" height="0">`);
  });

  spriteStream.on('close', () => {
    spriteStream.write(`</svg>
    );
    
    export default Sprite;`);
  });

  return spriteStream;
};

const Wormer = ({ srcPath, destPath, force }: WormerOptions) => {
  const items: [filePath: string, id: string][] = [];
  const spriteStream = createSpriteStream(destPath);

  const process = (filePath: string, id: string) => {
    const fullPath = path.join(srcPath, filePath);
    const fileStream = fs.createReadStream(fullPath);
    fileStream.pipe(spriteStream);
  };

  const add = (filePath: string, id: string) => {
    items.push([filePath, id]);
  };

  return {
    add,
  };
};

export default Wormer;
