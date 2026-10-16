// usage: [WITH_MAIN=1] node src/run.mjs <iconDir> <count> <workers> [--dump file]
// Prints the wall time from process start to all results in hand, in ms.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { transformAll } from './pool.mjs';

const transformUrl = new URL(
  '../../../packages/svgworm/dist/core/svg/transform.js',
  import.meta.url,
).href;
// The main thread of a real build imports the core, and with it svgo, in every case.
const { transformIcon } = await import(transformUrl);

const [iconDir, count, workers, flag, dumpFile] = process.argv.slice(2);
const inputs = readdirSync(iconDir)
  .filter((name) => name.endsWith('.svg'))
  .toSorted()
  .slice(0, Number(count))
  .map((name) => ({
    content: readFileSync(join(iconDir, name)),
    file: name,
    symbolId: name.slice(0, -4),
    mode: 'auto',
  }));

const results = await transformAll(inputs, {
  workers: Number(workers),
  transformIcon,
  transformUrl,
  withMain: process.env.WITH_MAIN === '1',
});
const elapsed = Math.round(performance.now());
if (flag === '--dump') writeFileSync(dumpFile, JSON.stringify(results));
console.log(elapsed);
