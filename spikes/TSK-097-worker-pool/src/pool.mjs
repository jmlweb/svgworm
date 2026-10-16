import { Worker } from 'node:worker_threads';

const WORKER_URL = new URL('./worker.mjs', import.meta.url);

/**
 * Transforms every input on `workers` threads and returns the results in input order.
 * Round-robin chunks, one message per worker: the prototype from TSK-097's description.
 */
export const transformAll = async (
  inputs,
  { workers, transformIcon, transformUrl, withMain = false },
) => {
  if (workers === 0) return inputs.map((input) => transformIcon(input));
  // withMain: the main thread takes one chunk too, and works on it while the workers boot.
  const lanes = workers + (withMain ? 1 : 0);
  const chunks = Array.from({ length: lanes }, () => []);
  inputs.forEach((input, index) => chunks[index % lanes].push({ index, input }));
  const results = new Array(inputs.length);
  const mainChunk = withMain ? chunks.pop() : [];
  const pending = Promise.all(
    chunks.map(
      (items) =>
        new Promise((resolve, reject) => {
          const worker = new Worker(WORKER_URL, { workerData: { items, transformUrl } });
          worker.once('message', (done) => {
            done.forEach(({ index, result }) => {
              results[index] = result;
            });
            resolve();
          });
          worker.once('error', reject);
        }),
    ),
  );
  mainChunk.forEach(({ index, input }) => {
    results[index] = transformIcon(input);
  });
  await pending;
  return results;
};
