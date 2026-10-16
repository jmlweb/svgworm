import { parentPort, workerData } from 'node:worker_threads';

const { transformIcon } = await import(workerData.transformUrl);
const results = workerData.items.map(({ index, input }) => ({
  index,
  result: transformIcon(input),
}));
parentPort.postMessage(results);
