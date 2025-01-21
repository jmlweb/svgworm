import fs from 'node:fs/promises';

export const writeCacheContent = (filePath: string, content: string) =>
  fs.writeFile(filePath, content).catch();
