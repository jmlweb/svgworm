import { optimize, type PluginConfig } from 'svgo';

import { DiagnosticCode, type Diagnostic } from '../errors.ts';
import {
  SERIALIZE_OPTIONS,
  getTextContent,
  walkElements,
  type XastRoot,
} from './tree.ts';

// Phase one: every <style> rule and style="" declaration becomes a presentation attribute,
// so later passes read colors from a single place and no stylesheet can leak between symbols.
export const STYLE_PLUGINS: readonly PluginConfig[] = [
  // Design tools export every document class (Illustrator's .st0….st36) into each file. Rules
  // whose selectors match nothing are harmless, so drop them rather than fail on them as
  // leftovers (RPT-007). It must run before inlining: inlining removes the class attributes, and
  // a rule such as an @media variant of an inlined class would then look unused and vanish.
  'minifyStyles',
  {
    name: 'inlineStyles',
    params: { onlyMatchedOnce: false, removeMatchedSelectors: true },
  },
  'convertStyleToAttrs',
];

// Phase two is the pinned optimizer config (contract: "SVG bytes come from the pinned svgo
// version with the core's fixed config"). Changing it changes output bytes, so it needs a
// changeset and a review of the contract snapshots.
export const OPTIMIZE_PLUGINS: readonly PluginConfig[] = [
  // SVG 2 `href` works in every supported browser, and it lets removeUnusedNS drop the
  // xlink namespace so the sprite root needs no extra declarations.
  'removeXlink',
  {
    name: 'preset-default',
    params: {
      overrides: {
        // The viewBox is required by the contract and removeViewBox is not in the preset,
        // so nothing to disable there. Ids are renamed later (ids.ts); minifying them here
        // would only hide the source names.
        cleanupIds: { minify: false },
        removeDesc: { removeAny: true },
        // License comments are collected before this pass and written once per sprite
        // (TSK-066), so none may stay inside a symbol; the preset would keep `<!--! … -->`.
        removeComments: { preservePatterns: false },
      },
    },
  },
  // Design tools put layer names in <title> and <desc>. The adapter owns accessible titles.
  'removeTitle',
];

export const normalizeStyles = (text: string): string =>
  optimize(text, {
    multipass: false,
    js2svg: SERIALIZE_OPTIONS,
    plugins: [...STYLE_PLUGINS],
  }).data;

export const optimizeMarkup = (text: string): string =>
  optimize(text, {
    multipass: false,
    js2svg: SERIALIZE_OPTIONS,
    plugins: [...OPTIMIZE_PLUGINS],
  }).data;

/** A `<style>` that survives normalizeStyles holds rules that cannot be inlined. */
export const findLeftoverStyles = (
  root: XastRoot,
  file: string,
): readonly Diagnostic[] => {
  const errors: Diagnostic[] = [];
  walkElements(root, (element) => {
    if (element.name !== 'style') return;
    const text = getTextContent(element);
    const hasAtRule = text.includes('@');
    const selectors = [...text.matchAll(/([^{}]+)\{/g)]
      .map(([, selector = '']) => selector.trim())
      .filter((selector) => selector !== '' && !selector.startsWith('@'))
      .join(', ');
    errors.push({
      code: hasAtRule
        ? DiagnosticCode.UNSCOPABLE_STYLE
        : DiagnosticCode.LEFTOVER_STYLE,
      file,
      message: hasAtRule
        ? '<style> has an at-rule (such as @media) that cannot be inlined, and a raw <style> leaks between icons in a sprite'
        : `<style> has rules that cannot be inlined (${selectors}), and a raw <style> leaks between icons in a sprite. Remove those rules, or move their effect into attributes`,
    });
  });
  return errors;
};
