import { posix } from 'node:path';

import { ColorMode, type ColorRule } from '../../config/schema.ts';

/**
 * The last rule whose glob matches the public name wins (ADR-0004). The glob is matched
 * against the name (NFC, "/" separators), never against the file path.
 */
export const resolveColorMode = (
  name: string,
  rules: readonly Pick<ColorRule, 'match' | 'color'>[],
): ColorMode =>
  rules.findLast((rule) => posix.matchesGlob(name, rule.match))?.color ??
  ColorMode.AUTO;
