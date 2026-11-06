import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

import { manifest } from '../../svgworm/icons.js';

// Everything the landing page says about its own build, read from the committed files, so the
// numbers cannot drift from what svgworm wrote. Builds run from apps/site, like worked-example.ts.
export type BuildSummary = {
  readonly sourceFiles: number;
  readonly source: string;
  readonly sprite: string;
  readonly stack: string;
  readonly output: string;
  readonly savings: string;
  readonly iconFiles: number;
  readonly writes: readonly { readonly path: string; readonly size: string }[];
  readonly cache: string;
  // Raw figures behind the formatted ones, so a test can compare them with svgworm's own stats.
  readonly bytes: {
    readonly source: number;
    readonly sprite: number;
    readonly stack: number;
  };
};

const SECONDS_PER_YEAR = 31_536_000;

// Same format as the CLI's plain reporter, so the terminal sample reads like a real run.
export const formatBytes = (bytes: number) =>
  Math.abs(bytes) < 1024
    ? `${String(bytes)} B`
    : `${(bytes / 1024).toFixed(1)} KiB`;

export const formatSavings = (savedBytes: number, sourceBytes: number) =>
  sourceBytes === 0
    ? formatBytes(savedBytes)
    : `${formatBytes(savedBytes)} (${((savedBytes / sourceBytes) * 100).toFixed(1)}%)`;

const sizeOf = (path: string) => statSync(join(process.cwd(), path)).size;

// Only the indented lines under the /icons/* path, so another block's max-age cannot match.
export const readCacheTime = (headers: string) => {
  const block = /^\/icons\/\*\n((?:[ \t]+.*\n?)*)/m.exec(headers)?.[1];
  const maxAge = block && /max-age=(\d+)/.exec(block)?.[1];
  if (!maxAge) throw new Error('build summary: no max-age for /icons/*');
  const years = Math.round(Number(maxAge) / SECONDS_PER_YEAR);
  return `${String(years)} ${years === 1 ? 'year' : 'years'}`;
};

export const readBuildSummary = (): BuildSummary => {
  const group = manifest.sprites.icons;
  const spriteUrl = group?.sprite?.url;
  const stackUrl = group?.stack?.url;
  const fileBytes = (url: string | undefined) =>
    url === undefined ? 0 : sizeOf(`public${url}`);
  const spriteBytes = fileBytes(spriteUrl);
  const stackBytes = fileBytes(stackUrl);
  const iconUrls = [spriteUrl, stackUrl].filter((url) => url !== undefined);
  const sources = readdirSync(join(process.cwd(), 'icons'), {
    recursive: true,
    encoding: 'utf8',
  }).filter((file) => file.endsWith('.svg'));
  const sourceBytes = sources
    .map((file) => sizeOf(`icons/${file}`))
    .reduce((total, bytes) => total + bytes, 0);
  const outputBytes = spriteBytes + stackBytes;
  const savedBytes = sourceBytes - outputBytes;
  const writes = [
    ...iconUrls.map((url) => `public${url}`),
    'svgworm/icons.js',
    'svgworm/icons.d.ts',
    'svgworm/manifest.json',
  ].map((path) => ({ path, size: formatBytes(sizeOf(path)) }));
  return {
    sourceFiles: sources.length,
    source: formatBytes(sourceBytes),
    sprite: formatBytes(spriteBytes),
    stack: formatBytes(stackBytes),
    output: formatBytes(outputBytes),
    savings: formatSavings(savedBytes, sourceBytes),
    iconFiles: iconUrls.length,
    writes,
    cache: readCacheTime(
      readFileSync(join(process.cwd(), 'public/_headers'), 'utf8'),
    ),
    bytes: { source: sourceBytes, sprite: spriteBytes, stack: stackBytes },
  };
};
