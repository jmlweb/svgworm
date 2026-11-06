import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

import type { IconName } from '../../svgworm/icons.js';

import { manifest } from '../../svgworm/icons.js';

// The worked example (TSK-104) traces one icon through the committed files at build time, so
// the page cannot drift from what svgworm wrote. Builds run from apps/site, like llms-source.ts.
export type IconTrace = {
  readonly source: string;
  // The <symbol> of a `use` icon, or the nested <svg> of an `img` or `mask` icon.
  readonly generated: string;
  readonly fileUrl: string;
  readonly manifestEntry: string;
};

const escapeRegExp = (text: string) =>
  text.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Found by the manifest id, whatever the attribute order. Entries never nest here, so the first
// closing tag after the opening one ends it.
export const extractEntry = (
  file: string,
  tag: 'symbol' | 'svg',
  id: string,
): string => {
  const opening = new RegExp(`<${tag}\\b[^>]*\\bid="${escapeRegExp(id)}"`);
  const start = file.search(opening);
  const end = file.indexOf(`</${tag}>`, start);
  if (start === -1 || end === -1) {
    throw new Error(`worked example: no <${tag} id="${id}"> in the file`);
  }
  return file.slice(start, end + `</${tag}>`.length);
};

export const traceIcon = (name: IconName): IconTrace => {
  const entry = manifest.icons[name];
  const inSprite = entry.delivery === 'use';
  const group = manifest.sprites[entry.sprite];
  const fileUrl = inSprite ? group?.sprite?.url : group?.stack?.url;
  if (!fileUrl) {
    throw new Error(`worked example: no generated file holds ${name}`);
  }
  const root = process.cwd();
  const file = readFileSync(join(root, 'public', fileUrl), 'utf8');
  return {
    source: readFileSync(join(root, 'icons', `${name}.svg`), 'utf8').trimEnd(),
    generated: extractEntry(file, inSprite ? 'symbol' : 'svg', entry.id),
    fileUrl,
    manifestEntry: `"${name}": ${JSON.stringify(entry, null, 2)}`,
  };
};
