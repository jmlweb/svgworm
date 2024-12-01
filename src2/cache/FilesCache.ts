import fs from 'node:fs';
import path from 'node:path';

import getCacheDir from './getCacheDir';
import getFileHash from './getFileHash';

const fileExists = (filePath: string, cb: (exists: boolean) => void) =>
  fs.access(filePath, fs.constants.F_OK, (err) => cb(!err));

type Callback = (
  err: Error | null,
  data?: { content: string; fileHash: string },
) => void;

const FilesCache =
  (optimize: boolean, processor: (id: string, fileContent: string) => string) =>
  (id: string, fileContent: string, cb: Callback) => {
    const cacheDir = getCacheDir();
    const fileHash = getFileHash(optimize, id, fileContent);
    const filePath = path.resolve(cacheDir, fileHash);
    fileExists(filePath, (exists) => {
      if (exists) {
        fs.readFile(filePath, 'utf-8', (err, data) => {
          if (err) {
            cb(err);
          } else {
            cb(null, {
              content: data,
              fileHash,
            });
          }
        });
      } else {
        const content = processor(id, fileContent);
        fs.writeFile(filePath, content, (err) => {
          if (err) {
            cb(err);
          } else {
            cb(null, {
              content,
              fileHash,
            });
          }
        });
      }
    });
  };

export default FilesCache;
