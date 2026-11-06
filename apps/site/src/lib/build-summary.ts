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
  readonly cacheYears: number;
};

const SECONDS_PER_YEAR = 31_536_000;

// Same format as the CLI's plain reporter, so the terminal sample reads like a real run.
const formatBytes = (bytes: number) =>
  Math.abs(bytes) < 1024
    ? `${String(bytes)} B`
    : `${(bytes / 1024).toFixed(1)} KiB`;

const sizeOf = (path: string) => statSync(join(process.cwd(), path)).size;

const readCacheYears = () => {
  const headers = readFileSync(join(process.cwd(), 'public/_headers'), 'utf8');
  const maxAge = /^\/icons\/\*\n.*?max-age=(\d+)/ms.exec(headers)?.[1];
  if (!maxAge) throw new Error('build summary: no max-age for /icons/*');
  return Number(maxAge) / SECONDS_PER_YEAR;
};

export const readBuildSummary = (): BuildSummary => {
  const group = manifest.sprites.icons;
  const iconUrls = [group?.sprite?.url, group?.stack?.url].filter(
    (url) => url !== undefined,
  );
  const [spriteBytes = 0, stackBytes = 0] = iconUrls.map((url) =>
    sizeOf(`public${url}`),
  );
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
    savings: `${formatBytes(savedBytes)} (${((savedBytes / sourceBytes) * 100).toFixed(1)}%)`,
    iconFiles: iconUrls.length,
    writes,
    cacheYears: readCacheYears(),
  };
};
