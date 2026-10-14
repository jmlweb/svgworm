#!/usr/bin/env node
// Proves the site's claims after `astro build` (TSK-036, ADR-0016, TSK-038, ADR-0018):
//   1. the icons come from the hashed sprite: every <use href> points at a sprite in the
//      manifest, the sprite file is in dist/, and every icon in the manifest is used;
//   2. _headers serves /icons/* immutable;
//   3. every doc in src/content/docs has a page, and every page has a title, a description,
//      a canonical URL and a sitemap entry;
//   4. /llms.txt and /llms-full.txt are served, and llms-full.txt holds every doc.
// The site itself may ship client JS; only its icons must need none (they are `<use>` refs).
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

const docsDir = join(root, 'src/content/docs');
const docSlugs = (await readdir(docsDir))
  .filter((name) => name.endsWith('.md'))
  .map((name) => name.slice(0, -'.md'.length))
  .toSorted();

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
  for (const [, url, id] of html.matchAll(/<use href="([^"#]+)#([^"]+)"/g)) {
    if (!spriteUrls.has(url)) problems.push(`${page}: unknown sprite ${url}`);
    usedIds.add(`${url}#${id}`);
  }
}

const site = new URL(
  /site:\s*['"]([^'"]+)['"]/.exec(
    await readFile(join(root, 'astro.config.ts'), 'utf8'),
  )?.[1] ?? 'http://localhost',
);
const sitemap = await readFile(join(dist, 'sitemap-0.xml'), 'utf8').catch(
  () => '',
);
const sitemapUrls = new Set(
  [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => loc),
);
if (sitemapUrls.size === 0) problems.push('sitemap-0.xml is missing or empty');

for (const slug of docSlugs) {
  if (!files.includes(`docs/${slug}/index.html`))
    problems.push(`doc "${slug}" has no page at docs/${slug}/index.html`);
}
for (const page of pages) {
  const html = await readFile(join(dist, page), 'utf8');
  const title = /<title>([^<]+)<\/title>/.exec(html)?.[1];
  const description = /<meta name="description" content="([^"]+)"/.exec(
    html,
  )?.[1];
  const canonical = /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1];
  if (!title) problems.push(`${page}: no <title>`);
  if (!description) problems.push(`${page}: no meta description`);
  if (!canonical) problems.push(`${page}: no canonical URL`);
  else if (!canonical.startsWith(site.origin))
    problems.push(`${page}: canonical ${canonical} is not on ${site.origin}`);
  else if (!sitemapUrls.has(canonical))
    problems.push(`${page}: ${canonical} is not in the sitemap`);
}

const llmsFull = await readFile(join(dist, 'llms-full.txt'), 'utf8').catch(
  () => '',
);
if (!files.includes('llms.txt')) problems.push('/llms.txt is not in dist');
if (llmsFull === '') problems.push('/llms-full.txt is missing or empty');
for (const slug of docSlugs) {
  if (!llmsFull.includes(new URL(`/docs/${slug}`, site).href))
    problems.push(`llms-full.txt does not include doc "${slug}"`);
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
    `${String(usedIds.size)} icon(s) from the hashed sprite, ${String(docSlugs.length)} doc(s) ` +
    'with a page, title, description and sitemap entry, llms.txt and llms-full.txt, immutable /icons/*',
);
