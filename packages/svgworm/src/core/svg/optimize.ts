import { optimize, type PluginConfig } from 'svgo';

import { DiagnosticCode, type Diagnostic } from '../errors.ts';
import { getTextContent, walkElements, type XastRoot } from './tree.ts';

const OUTPUT = { pretty: false, eol: 'lf', finalNewline: false } as const;

// Phase one: every <style> rule and style="" declaration becomes a presentation attribute,
// so later passes read colors from a single place and no stylesheet can leak between symbols.
const STYLE_PLUGINS: readonly PluginConfig[] = [
  { name: 'inlineStyles', params: { onlyMatchedOnce: false, removeMatchedSelectors: true } },
  'convertStyleToAttrs',
];

// Phase two is the pinned optimizer config (contract: "SVG bytes come from the pinned svgo
// version with the core's fixed config"). Changing it changes output bytes, so it needs a
// changeset and a review of the contract snapshots.
const OPTIMIZE_PLUGINS: readonly PluginConfig[] = [
  {
    name: 'preset-default',
    params: {
      overrides: {
        // The viewBox is required by the contract and removeViewBox is not in the preset,
        // so nothing to disable there. Ids are renamed later (ids.ts); minifying them here
        // would only hide the source names.
        cleanupIds: { minify: false },
        removeDesc: { removeAny: true },
      },
    },
  },
  // Design tools put layer names in <title> and <desc>. The adapter owns accessible titles.
  'removeTitle',
];

export const normalizeStyles = (text: string): string =>
  optimize(text, { multipass: false, js2svg: OUTPUT, plugins: [...STYLE_PLUGINS] }).data;

export const optimizeMarkup = (text: string): string =>
  optimize(text, { multipass: false, js2svg: OUTPUT, plugins: [...OPTIMIZE_PLUGINS] }).data;

/** A `<style>` that survives normalizeStyles holds rules that cannot be inlined. */
export const findLeftoverStyles = (
  root: XastRoot,
  file: string,
): readonly Diagnostic[] => {
  const errors: Diagnostic[] = [];
  walkElements(root, (element) => {
    if (element.name !== 'style') return;
    const hasAtRule = getTextContent(element).includes('@');
    errors.push({
      code: hasAtRule ? DiagnosticCode.UNSCOPABLE_STYLE : DiagnosticCode.LEFTOVER_STYLE,
      file,
      message: hasAtRule
        ? '<style> has an at-rule (such as @media) that cannot be inlined, and a raw <style> leaks between icons in a sprite'
        : '<style> has rules that cannot be inlined (such as :hover), and a raw <style> leaks between icons in a sprite',
    });
  });
  return errors;
};
