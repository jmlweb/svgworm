import { createHash } from 'node:crypto';

import type { TransformInput, TransformResult } from './transform.ts';

/**
 * Remembers per-icon transform results across builds of one process, so `watch` only
 * re-optimizes the icons that changed (R-30, ADR-0015). Keyed by content and everything
 * else that feeds the transform; never by path alone, mtime or order. Entries unused by the
 * latest build are dropped, so the cache never outgrows the current icon set.
 */
export type TransformCache = {
  readonly get: (input: TransformInput) => TransformResult | undefined;
  readonly set: (input: TransformInput, result: TransformResult) => void;
  /** Drops every entry the build since the last sweep did not read or write. */
  readonly sweep: () => void;
  readonly size: () => number;
};

const keyOf = (input: TransformInput): string =>
  createHash('sha256')
    .update(input.file)
    .update('\0')
    .update(input.symbolId)
    .update('\0')
    .update(input.mode)
    .update('\0')
    .update(input.content)
    .digest('hex');

export const createTransformCache = (): TransformCache => {
  const entries = new Map<string, TransformResult>();
  let touched = new Set<string>();
  return {
    get: (input) => {
      const key = keyOf(input);
      const hit = entries.get(key);
      if (hit !== undefined) touched.add(key);
      return hit;
    },
    set: (input, result) => {
      const key = keyOf(input);
      entries.set(key, result);
      touched.add(key);
    },
    sweep: () => {
      for (const key of entries.keys()) {
        if (!touched.has(key)) entries.delete(key);
      }
      touched = new Set();
    },
    size: () => entries.size,
  };
};
