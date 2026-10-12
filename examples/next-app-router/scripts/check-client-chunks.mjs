#!/usr/bin/env node
// Proves the "zero client JS" claim after `next build` (TSK-016, R-40):
//   1. no client chunk mentions the adapter, the sprite URLs, or a symbol id;
//   2. the prerendered HTML references the sprite through <use href> (and the stack for
//      img and mask icons), so the icons are in the server output, not added by a script.
// Exit 1 with the offending files when either fails. Method from the TSK-007 spike.
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = process.cwd();
const manifestPath = join(root, 'svgworm/manifest.json');
const chunksDir = join(root, '.next/static');
const htmlPath = join(root, '.next/server/app/index.html');

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const files = Object.values(manifest.sprites).flatMap((group) =>
  [group.sprite, group.stack].filter(Boolean),
);
const icons = Object.values(manifest.icons);

const markers = [
  '@svgworm/react',
  'createIcon',
  'SvgwormReactError',
  ...files.map((file) => file.url),
  ...icons.map((icon) => `#${icon.id}`),
];

const listJs = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
    .map((entry) => join(entry.parentPath, entry.name))
    .toSorted();
};

const chunks = await listJs(chunksDir);
if (chunks.length === 0) {
  console.error(
    `no client chunks found under ${relative(root, chunksDir)}; run "next build" first`,
  );
  process.exit(1);
}

const leaks = [];
for (const chunk of chunks) {
  const text = await readFile(chunk, 'utf8');
  const found = markers.filter((marker) => text.includes(marker));
  if (found.length > 0) leaks.push({ chunk: relative(root, chunk), found });
}

const html = await readFile(htmlPath, 'utf8').catch(() => {
  console.error(
    `no prerendered page at ${relative(root, htmlPath)}; run "next build" first`,
  );
  process.exit(1);
});
const useIcons = icons.filter((icon) => icon.delivery === 'use');
const stackIcons = icons.filter((icon) => icon.delivery !== 'use');
const problems = [];
for (const file of files) {
  if (!html.includes(file.url))
    problems.push(`HTML does not reference ${file.url}`);
}
for (const icon of useIcons) {
  const expected = `<use href="${manifest.sprites[icon.sprite].sprite.url}#${icon.id}"`;
  if (!html.includes(expected)) problems.push(`HTML is missing ${expected}`);
}
for (const icon of stackIcons) {
  const expected = `${manifest.sprites[icon.sprite].stack.url}#${icon.id}`;
  if (!html.includes(expected)) problems.push(`HTML is missing ${expected}`);
}

console.log(
  `checked ${String(chunks.length)} client chunk(s) for ${String(markers.length)} marker(s); ` +
    `HTML references ${String(useIcons.length)} <use> icon(s) and ${String(stackIcons.length)} stack icon(s)`,
);
if (leaks.length > 0) {
  console.error('icon code reached client chunks:');
  for (const leak of leaks)
    console.error(`  ${leak.chunk}: ${leak.found.join(', ')}`);
}
for (const problem of problems) console.error(`  ${problem}`);
process.exit(leaks.length > 0 || problems.length > 0 ? 1 : 0);
