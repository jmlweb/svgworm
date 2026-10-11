// Fingerprints fixtures/**/*.svg with the built core. CI runs it on Linux, macOS and Windows
// and requires byte-identical output (principle 2). Usage: node scripts/fingerprint-fixtures.mjs [outFile]
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fingerprintFiles } from '../packages/svgworm/dist/index.js';

const fixturesDir = fileURLToPath(new URL('../fixtures', import.meta.url));

const entries = await readdir(fixturesDir, {
  recursive: true,
  withFileTypes: true,
});
const files = await Promise.all(
  entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.svg'))
    .map(async (entry) => {
      const absolute = join(entry.parentPath, entry.name);
      return {
        path: relative(fixturesDir, absolute),
        content: await readFile(absolute),
      };
    }),
);

if (files.length === 0) {
  throw new Error(
    'No fixtures found: the determinism check would pass vacuously',
  );
}

const output = fingerprintFiles(files);
const outFile = process.argv[2];
if (outFile) {
  await writeFile(outFile, output);
} else {
  process.stdout.write(output);
}
