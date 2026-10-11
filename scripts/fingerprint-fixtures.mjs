// Compiles fixtures/**/*.svg with the built core and fingerprints every generated file
// plus the sorted errors of the invalid fixtures. CI runs it on Linux, macOS and Windows and
// requires byte-identical output (principle 2). Usage: node scripts/fingerprint-fixtures.mjs [outFile]
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { compile } from '../packages/svgworm/dist/index.js';

const fixturesDir = fileURLToPath(new URL('../fixtures', import.meta.url));
const options = { flatten: false, publicPath: '/icons', color: [] };

const entries = await readdir(fixturesDir, {
  recursive: true,
  withFileTypes: true,
});
const sources = await Promise.all(
  entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.svg'))
    .map(async (entry) => {
      const absolute = join(entry.parentPath, entry.name);
      const relativePath = relative(fixturesDir, absolute).replaceAll(
        '\\',
        '/',
      );
      return {
        path: `fixtures/${relativePath}`,
        relativePath,
        content: await readFile(absolute),
      };
    }),
);

if (sources.length === 0) {
  throw new Error(
    'No fixtures found: the determinism check would pass vacuously',
  );
}

// style/unscopable-media.svg is an expected error, like everything under invalid/.
const isInvalid = (source) =>
  source.relativePath.startsWith('invalid/') ||
  source.relativePath === 'style/unscopable-media.svg';

const sha256 = (text) => createHash('sha256').update(text).digest('hex');

const valid = compile(
  sources.filter((source) => !isInvalid(source)),
  options,
);
if (!valid.ok) {
  throw new Error(
    `Valid fixtures failed to compile:\n${JSON.stringify(valid.errors, null, 2)}`,
  );
}
const invalid = compile(sources.filter(isInvalid), options);
if (invalid.ok) {
  throw new Error(
    'Invalid fixtures compiled, so the error path is not exercised',
  );
}

const lines = [
  ...valid.files.map(
    (file) => `${sha256(file.content)}  ${file.target}/${file.name}`,
  ),
  `${sha256(JSON.stringify(invalid.errors))}  invalid-errors (${String(invalid.errors.length)})`,
];
const output = `${lines.join('\n')}\n`;

const outFile = process.argv[2];
if (outFile) {
  await writeFile(outFile, output);
} else {
  process.stdout.write(output);
}
