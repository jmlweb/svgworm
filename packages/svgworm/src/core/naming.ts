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

/** The path segments that make up the name, without the extension. */
const nameSegments = (
  file: string,
  options: { readonly flatten: boolean },
): readonly string[] => {
  const segments = file.split('/').filter((s) => s !== '' && s !== '.');
  const last = segments.at(-1) ?? '';
  const withoutExtension = [
    ...segments.slice(0, -1),
    last.replace(SVG_EXTENSION, ''),
  ];
  return options.flatten ? withoutExtension.slice(-1) : withoutExtension;
};

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
  if (!SVG_EXTENSION.test(file.split('/').at(-1) ?? '')) {
    return fail(DiagnosticCode.NOT_SVG_FILE, file, 'not an .svg file');
  }
  const kept = nameSegments(file, options);
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

const CASE_BOUNDARY = /(\p{Ll})(\p{Lu})/gu;

export type CaseFolded = {
  readonly kind: 'file' | 'folder';
  /** The relative path up to and including the segment, NFC and `/`-separated. */
  readonly path: string;
  readonly message: string;
};

/**
 * Name segments where letter case carried meaning (ADR-0021). The name keeps ADR-0007's case
 * folding; each message suggests the segment that gives a readable name. A folder is reported
 * on its own, so callers can report it once instead of once per file inside it.
 */
export const caseFoldedSegments = (
  relativePath: string,
  options: { readonly flatten: boolean },
): readonly CaseFolded[] => {
  if (!deriveName(relativePath, options).ok) return [];
  const file = toPosix(relativePath).normalize('NFC');
  const segments = file.split('/').filter((s) => s !== '' && s !== '.');
  const firstKept = options.flatten ? segments.length - 1 : 0;
  return segments.flatMap((segment, index) => {
    const isFile = index === segments.length - 1;
    const stem = isFile ? segment.replace(SVG_EXTENSION, '') : segment;
    if (index < firstKept || !/\p{Ll}\p{Lu}/u.test(stem)) return [];
    const readable = normalizeSegment(stem.replace(CASE_BOUNDARY, '$1-$2'));
    const kind = isFile ? 'file' : 'folder';
    const renamed = isFile ? `${readable}.svg` : readable;
    return [
      {
        kind,
        path: segments.slice(0, index + 1).join('/'),
        message: `letter case is not kept in names: ${kind} "${segment}" gives "${normalizeSegment(stem)}"; rename it to ${renamed} for "${readable}"`,
      },
    ];
  });
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
