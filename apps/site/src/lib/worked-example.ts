import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

import type { IconName } from '../../svgworm/icons.js';

import { manifest } from '../../svgworm/icons.js';

// The worked example (TSK-104) traces one icon through the committed files at build time, so
// the page cannot drift from what svgworm wrote. Builds run from apps/site, like llms-source.ts.
export type IconTrace = {
  readonly source: string;
  readonly symbol: string;
  readonly manifestEntry: string;
};

const escapeRegExp = (text: string) =>
  text.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Found by the manifest id, whatever the attribute order. Symbols never nest, so the first
// closing tag after the opening one ends it.
export const extractSymbol = (sprite: string, id: string): string => {
  const opening = new RegExp(`<symbol\\b[^>]*\\bid="${escapeRegExp(id)}"`);
  const start = sprite.search(opening);
  const end = sprite.indexOf('</symbol>', start);
  if (start === -1 || end === -1) {
    throw new Error(`worked example: no <symbol id="${id}"> in the sprite`);
  }
  return sprite.slice(start, end + '</symbol>'.length);
};

export const traceIcon = (name: IconName): IconTrace => {
  const entry = manifest.icons[name];
  const spriteUrl = manifest.sprites[entry.sprite]?.sprite?.url;
  if (!spriteUrl) {
    throw new Error(`worked example: ${name} is not in a sprite file`);
  }
  const root = process.cwd();
  const sprite = readFileSync(join(root, 'public', spriteUrl), 'utf8');
  return {
    source: readFileSync(join(root, 'icons', `${name}.svg`), 'utf8').trimEnd(),
    symbol: extractSymbol(sprite, entry.id),
    manifestEntry: `"${name}": ${JSON.stringify(entry, null, 2)}`,
  };
};
