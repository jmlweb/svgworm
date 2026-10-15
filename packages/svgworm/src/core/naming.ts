import { DiagnosticCode, type Diagnostic } from './errors.ts';
import { toPosix } from './fs.ts';

const SVG_EXTENSION = /\.svg$/i;
const REPLACEMENT_CHAR = '�';
const SYMBOL_ID_PREFIX = 'i-';

// A run starts with a non-letter/mark/number or a default-ignorable code point and swallows
// the marks that follow, so no segment can start with, or consist only of, combining marks.
const SEPARATOR_RUN =
  /(?:^\p{M}|[^\p{L}\p{M}\p{N}]|\p{Default_Ignorable_Code_Point})(?:[^\p{L}\p{N}]|\p{Default_Ignorable_Code_Point})*/gu;

export type NameResult =
  | { readonly ok: true; readonly name: string }
  | { readonly ok: false; readonly error: Diagnostic };

const normalizeSegment = (segment: string): string =>
  segment
    .normalize('NFC')
    .toLowerCase()
    .normalize('NFC')
    // Final_Sigma makes toLowerCase context-dependent, so fold it to keep names stable.
    .replaceAll('ς', 'σ')
    .replace(SEPARATOR_RUN, '-')
    .replace(/^-+|-+$/g, '');

const fail = (
  code: Diagnostic['code'],
  file: string,
  message: string,
): NameResult => ({ ok: false, error: { code, file, message } });

/** Public name from a path relative to its source folder (output contract, "Public name"). */
export const deriveName = (
  relativePath: string,
  options: { readonly flatten: boolean },
): NameResult => {
  const file = toPosix(relativePath).normalize('NFC');
  if (relativePath.includes(REPLACEMENT_CHAR) || !relativePath.isWellFormed()) {
    return fail(
      DiagnosticCode.INVALID_PATH_ENCODING,
      file,
      'file name is not valid Unicode (undecodable bytes or lone surrogates)',
    );
  }
  const segments = file.split('/').filter((s) => s !== '' && s !== '.');
  const last = segments.at(-1) ?? '';
  if (!SVG_EXTENSION.test(last)) {
    return fail(DiagnosticCode.NOT_SVG_FILE, file, 'not an .svg file');
  }
  const withoutExtension = [
    ...segments.slice(0, -1),
    last.replace(SVG_EXTENSION, ''),
  ];
  const kept = options.flatten ? withoutExtension.slice(-1) : withoutExtension;
  const normalized = kept.map(normalizeSegment);
  const emptyIndex = normalized.indexOf('');
  if (emptyIndex !== -1) {
    return fail(
      DiagnosticCode.EMPTY_NAME,
      file,
      `segment "${kept[emptyIndex] ?? ''}" is empty after normalization`,
    );
  }
  return { ok: true, name: normalized.join('/') };
};

const encodeChar = (char: string): string => {
  if (char === '/') return '--';
  if (/^[a-z0-9-]$/.test(char)) return char;
  return `_${(char.codePointAt(0) ?? 0).toString(16)}_`;
};

/** Symbol id from a public name (output contract, "Symbol id"). Injective and an NCName. */
export const toSymbolId = (name: string): string =>
  SYMBOL_ID_PREFIX + Array.from(name, encodeChar).join('');

export const toInternalId = (symbolId: string, ordinal: number): string =>
  `${symbolId}_${String(ordinal)}`;
