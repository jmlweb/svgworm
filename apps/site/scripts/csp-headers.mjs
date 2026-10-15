#!/usr/bin/env node
// Fills the Content-Security-Policy in dist/_headers after `astro build` (TSK-052).
// Astro inlines the small page scripts (the worm pause control, the docs copy buttons and
// scroll-spy) as <script> elements, so the policy allows them by SHA-256 hash instead of
// 'unsafe-inline'. The hashes come from the built HTML, so they stay right across builds.
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');
const PLACEHOLDER = '__SCRIPT_HASHES__';

const entries = await readdir(dist, { withFileTypes: true, recursive: true });
const pages = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
  .map((entry) => join(entry.parentPath, entry.name))
  .toSorted();

const hashes = new Set();
for (const page of pages) {
  const html = await readFile(page, 'utf8');
  for (const [, attributes, body] of html.matchAll(
    /<script([^>]*)>([\s\S]*?)<\/script>/g,
  )) {
    if (/\ssrc=/.test(attributes)) continue;
    hashes.add(
      `'sha256-${createHash('sha256').update(body).digest('base64')}'`,
    );
  }
}

const headersPath = join(dist, '_headers');
const headers = await readFile(headersPath, 'utf8');
if (!headers.includes(PLACEHOLDER)) {
  console.error(`_headers has no ${PLACEHOLDER} to fill`);
  process.exit(1);
}
await writeFile(
  headersPath,
  headers.replaceAll(PLACEHOLDER, [...hashes].toSorted().join(' ')),
);
console.log(
  `csp: ${String(hashes.size)} inline script hash(es) from ${String(pages.length)} page(s)`,
);
