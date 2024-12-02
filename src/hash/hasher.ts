import crypto from 'node:crypto';

const hasher = ([algorithm, options]: Parameters<typeof crypto.createHash>) => {
  const hash = crypto.createHash(algorithm, options);
  return (x: crypto.BinaryLike) => hash.update(x).digest('hex');
};

export default hasher;
