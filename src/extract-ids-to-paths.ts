import fs from 'fs/promises';

import path from 'path';

const getValidHTMLId = (input: string, isFirst: boolean) => {
  const cleanInput = input
    .trim()
    .replace(/[^a-zA-Z0-9._-\s+]/g, '')
    .replace(/\s+/g, '-');
  const htmlId = isFirst ? cleanInput.replace(/^[^a-zA-Z]+/, '') : cleanInput;
  return htmlId.length > 0
    ? htmlId
    : `id_${cleanInput.length > 0 ? cleanInput : 'empty'}`;
};

const extractIdsToPaths = async (srcPath: string) => {
  const entries = await fs.readdir(srcPath, {
    recursive: true,
    withFileTypes: true,
  });
  return entries.reduce(
    (acc, entry) => {
      if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.svg') {
        let id = [
          ...entry.parentPath.replace(`${srcPath}/`, '').split('/'),
          entry.name.slice(0, -4),
        ]
          .map((part, index) => getValidHTMLId(part, index === 0))
          .join('.');
        if (id in acc) {
          let i = 2;
          while (`${id}${i}` in acc) {
            i++;
          }
          id = `${id}${i}`;
        }

        const fullPath = path.join(entry.parentPath, entry.name);
        acc[id] = fullPath;
      }
      return acc;
    },
    {} as Record<string, string>,
  );
};

export default extractIdsToPaths;
