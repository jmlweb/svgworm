import crypto from 'node:crypto';

export const md5 = (x: crypto.BinaryLike) =>
  crypto.createHash('md5').update(x).digest('hex');
