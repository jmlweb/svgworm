import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { SourceInput } from './compile.ts';

const repositoryRoot = new URL('../../../../', import.meta.url);

/** Reads every `.svg` under a repository folder as compile input, in an arbitrary order. */
export const readSources = (folder: string): readonly SourceInput[] => {
  const root = new URL(`${folder}/`, repositoryRoot).pathname;
  return readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.svg'))
    .map((entry) => {
      const relativePath = join(entry.parentPath, entry.name)
        .slice(root.length)
        .replaceAll('\\', '/');
      return {
        path: `${folder}/${relativePath}`,
        relativePath,
        content: readFileSync(join(entry.parentPath, entry.name)),
      };
    });
};

/** Deterministic PRNG, so a failing shuffle can be replayed. */
const mulberry32 = (seed: number): (() => number) => {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const shuffle = <T>(items: readonly T[], seed: number): readonly T[] => {
  const random = mulberry32(seed);
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [copy[index], copy[other]] = [copy[other] as T, copy[index] as T];
  }
  return copy;
};
