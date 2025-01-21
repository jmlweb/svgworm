export const pLimit = (concurrency: number) => {
  let running = 0;
  const queue: (() => Promise<void>)[] = [];

  const processQueue = async () => {
    while (running < concurrency && queue.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const fn = queue.shift()!;
      running++;
      try {
        await fn();
      } finally {
        running--;
        processQueue();
      }
    }
  };

  return <R>(fn: () => R | Promise<R>) =>
    new Promise<R>((resolve, reject) => {
      queue.push(async () => {
        try {
          resolve(await fn());
        } catch (err) {
          reject(err);
        }
      });
      processQueue();
    });
};
