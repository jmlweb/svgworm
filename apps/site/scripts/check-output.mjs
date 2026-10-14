#!/usr/bin/env node
// Proves the site's claims after `astro build` (TSK-036, ADR-0016):
//   1. no client JS: no <script> tag in any page and no .js/.mjs file anywhere in dist/;
//   2. the icons come from the hashed sprite: every <use href> points at a sprite in the
//      manifest, the sprite file is in dist/, and every icon in the manifest is used;
//   3. _headers serves /icons/* immutable.
// Exit 1 with every problem found. Same approach as the Next.js example's check.
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');
const manifest = JSON.parse(
  await readFile(join(root, 'svgworm/manifest.json'), 'utf8'),
);

const entries = await readdir(dist, {
  withFileTypes: true,
  recursive: true,
}).catch(() => {
  console.error(`no ${relative(root, dist)}/; run "astro build" first`);
  process.exit(1);
});
const files = entries
  .filter((entry) => entry.isFile())
  .map((entry) =>
    relative(dist, join(entry.parentPath, entry.name)).replaceAll('\\', '/'),
  )
  .toSorted();

const problems = [];

const scripts = files.filter((file) => /\.(?:c|m)?js$/.test(file));
for (const file of scripts) problems.push(`JavaScript file in dist: ${file}`);

const pages = files.filter((file) => file.endsWith('.html'));
if (pages.length === 0) problems.push('no HTML page in dist');

const spriteUrls = new Map(
  Object.entries(manifest.sprites).flatMap(([name, group]) =>
    group.sprite ? [[group.sprite.url, name]] : [],
  ),
);
const usedIds = new Set();
for (const page of pages) {
  const html = await readFile(join(dist, page), 'utf8');
  if (/<script\b/i.test(html)) problems.push(`<script> tag in ${page}`);
  for (const [, url, id] of html.matchAll(/<use href="([^"#]+)#([^"]+)"/g)) {
    if (!spriteUrls.has(url)) problems.push(`${page}: unknown sprite ${url}`);
    usedIds.add(`${url}#${id}`);
  }
}

for (const url of spriteUrls.keys()) {
  if (!files.includes(url.replace(/^\//, '')))
    problems.push(`sprite ${url} is not in dist`);
}
for (const [name, icon] of Object.entries(manifest.icons)) {
  const url = manifest.sprites[icon.sprite]?.sprite?.url;
  if (!usedIds.has(`${url}#${icon.id}`))
    problems.push(`icon "${name}" is in the manifest but no page uses it`);
}

const headers = await readFile(join(dist, '_headers'), 'utf8').catch(() => '');
if (
  !/^\/icons\/\*\n\s+Cache-Control: public, max-age=31536000, immutable$/m.test(
    headers,
  )
)
  problems.push('_headers does not serve /icons/* immutable');

if (problems.length > 0) {
  for (const problem of problems) console.error(problem);
  process.exit(1);
}
console.log(
  `checked ${String(files.length)} file(s) and ${String(pages.length)} page(s): ` +
    `no client JS, ${String(usedIds.size)} icon(s) from the hashed sprite, immutable /icons/*`,
);
