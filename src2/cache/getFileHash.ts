import crypto from 'node:crypto';

import packageJson from '../../package.json';

const sha = (x: crypto.BinaryLike) =>
  crypto.createHash('sha256').update(x).digest('hex');

const getVersionHash = (() => {
  let hash: string;
  let lastOptimize: boolean;

  return (optimize: boolean) => {
    if (!hash || optimize !== lastOptimize) {
      hash = sha(`${sha(packageJson.version)}${sha(String(optimize))}`);
    }
    return hash;
  };
})();

const getFileHash = (optimize: boolean, id: string, fileContent: string) =>
  sha(`${getVersionHash(optimize)}${sha(id)}${sha(fileContent)}`);

export default getFileHash;
