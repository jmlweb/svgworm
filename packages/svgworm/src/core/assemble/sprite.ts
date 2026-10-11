const SVG_OPEN = '<svg xmlns="http://www.w3.org/2000/svg">';

// Only the stack's own :target rule may be a <style> in the output (ADR-0006, rule 4).
const STACK_STYLE =
  '<style>:root>svg{display:none}:root>svg:target{display:inline}</style>';

/** An icon ready to be placed in the sprite or the stack. */
export type SymbolMarkup = {
  readonly id: string;
  readonly viewBox: string;
  /** Presentation attributes carried over from the source root, as `name -> value`. */
  readonly attributes: readonly (readonly [string, string])[];
  /** Serialized children of the source root. */
  readonly inner: string;
};

const escapeAttribute = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;');

const startTagAttributes = (symbol: SymbolMarkup): string =>
  [['id', symbol.id], ['viewBox', symbol.viewBox], ...symbol.attributes]
    .map(([name, value]) => ` ${name}="${escapeAttribute(value)}"`)
    .join('');

const element = (name: string, symbol: SymbolMarkup): string =>
  symbol.inner === ''
    ? `<${name}${startTagAttributes(symbol)}/>`
    : `<${name}${startTagAttributes(symbol)}>${symbol.inner}</${name}>`;

/** One `<symbol>` per icon, for `<use href="sprite.svg#id">`. Callers pass them sorted. */
export const assembleSprite = (symbols: readonly SymbolMarkup[]): string =>
  `${SVG_OPEN}${symbols.map((symbol) => element('symbol', symbol)).join('')}</svg>`;

/** Nested `<svg>` per icon, shown only when it is the URL `:target` (ADR-0006). */
export const assembleStack = (symbols: readonly SymbolMarkup[]): string =>
  `${SVG_OPEN}${STACK_STYLE}${symbols.map((symbol) => element('svg', symbol)).join('')}</svg>`;
