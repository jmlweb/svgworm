#!/usr/bin/env node
// Proves the Vite build serves the icons it references (TSK-024), after `vite build`:
//   1. the bundle contains every sprite URL and icon id from the manifest;
//   2. each sprite URL is `<base>icons/<file>` and that file exists in the dist folder;
//   3. the dist `icons/` folder holds exactly the manifest's files, nothing stale.
// Usage: check-dist.mjs [--dist dist] [--base /]. Exit 1 with every problem found.
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    dist: { type: 'string', default: 'dist' },
    base: { type: 'string', default: '/' },
  },
});

const root = process.cwd();
const distDir = join(root, values.dist);
const base = values.base.endsWith('/') ? values.base : `${values.base}/`;

const manifest = JSON.parse(
  await readFile(join(root, 'svgworm/manifest.json'), 'utf8'),
);
const files = Object.values(manifest.sprites).flatMap((group) =>
  [group.sprite, group.stack].filter(Boolean),
);
const ids = Object.values(manifest.icons).map((icon) => icon.id);

const listJs = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
    .map((entry) => join(entry.parentPath, entry.name))
    .toSorted();
};

const bundles = await listJs(join(distDir, 'assets')).catch(() => []);
if (bundles.length === 0) {
  console.error(
    `no bundle under ${values.dist}/assets; run "vite build" first`,
  );
  process.exit(1);
}
const bundleText = (
  await Promise.all(bundles.map((bundle) => readFile(bundle, 'utf8')))
).join('\n');

const problems = [];
const distIcons = await readdir(join(distDir, 'icons')).catch(() => []);

for (const file of files) {
  const expectedUrl = `${base}icons/${file.file}`;
  if (file.url !== expectedUrl)
    problems.push(
      `manifest URL ${file.url} is not ${expectedUrl}: run svgworm with --public-path ${base}icons`,
    );
  if (!bundleText.includes(file.url))
    problems.push(`bundle does not reference ${file.url}`);
  if (!distIcons.includes(file.file))
    problems.push(`${values.dist}/icons/${file.file} is missing`);
}
for (const id of ids) {
  if (!bundleText.includes(id))
    problems.push(`bundle is missing icon id ${id}`);
}
const expectedFiles = new Set(files.map((file) => file.file));
for (const name of distIcons) {
  if (!expectedFiles.has(name))
    problems.push(`${values.dist}/icons/${name} is not in the manifest`);
}

console.log(
  `checked ${String(bundles.length)} bundle(s) in ${values.dist} at base ${base}: ` +
    `${String(files.length)} sprite file(s), ${String(ids.length)} icon id(s)`,
);
for (const problem of problems) console.error(`  ${problem}`);
process.exit(problems.length > 0 ? 1 : 0);
