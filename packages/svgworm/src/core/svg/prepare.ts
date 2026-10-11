import { normalizeStyles, optimizeMarkup } from './optimize.ts';
import { parseSvgTree, type ParseResult } from './tree.ts';

/** Styles inlined, then optimized, then parsed: the tree every later step reads. */
export const prepareTree = (text: string): ParseResult =>
  parseSvgTree(optimizeMarkup(normalizeStyles(text)));
