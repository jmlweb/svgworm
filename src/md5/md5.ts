import crypto from 'node:crypto';

const md5 = (x: crypto.BinaryLike) =>
  crypto.createHash('md5').update(x).digest('hex');

export default md5;
