import { compareCodePoints } from './compare-code-units.ts';
import { DiagnosticCode, type Diagnostic } from './errors.ts';
import { toPosix } from './fs.ts';

export type NamedPath = { readonly name: string; readonly path: string };

/** Messages show a path as found on disk, with `/` separators (output contract). */
export const toDisplayPath = (path: string): string => toPosix(path);

/** Sort key: NFC, so the order never depends on how the file system stored the name. */
export const toSortKey = (path: string): string =>
  toDisplayPath(path).normalize('NFC');

/** NFC order first, raw bytes as the tie-break for NFC and NFD twins. */
export const comparePaths = (a: string, b: string): number =>
  compareCodePoints(toSortKey(a), toSortKey(b)) || compareCodePoints(a, b);

/** Diagnostics are output too, so their order is fixed: file, then code, then message. */
export const compareDiagnostics = (a: Diagnostic, b: Diagnostic): number =>
  comparePaths(a.file, b.file) ||
  compareCodePoints(a.code, b.code) ||
  compareCodePoints(a.message, b.message);

const folderOf = (path: string): string =>
  path.slice(0, Math.max(0, path.lastIndexOf('/')));

// A collision is never fixed by svgworm (principle 5), so the message says what to do.
const describeFix = (
  paths: readonly string[],
  options: { readonly flatten: boolean },
): string => {
  const inOneFolder = new Set(paths.map(folderOf)).size === 1;
  if (inOneFolder) return 'rename one of the files';
  return options.flatten
    ? 'rename one of the files, or turn flatten off so the folder names stay in the icon names'
    : 'rename one of the files or folders';
};

/** One error per name produced by more than one file, listing every file (R-03). */
export const findCollisions = (
  entries: readonly NamedPath[],
  options: { readonly flatten: boolean } = { flatten: false },
): readonly Diagnostic[] => {
  const byName = Map.groupBy(entries, (entry) => entry.name);
  return [...byName.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([name, group]) => {
      const paths = group
        .map((entry) => toDisplayPath(entry.path))
        .toSorted(comparePaths);
      return {
        code: DiagnosticCode.NAME_COLLISION,
        file: paths[0] ?? name,
        message: `name "${name}" is produced by ${String(paths.length)} files: ${paths.join(', ')}. Fix: ${describeFix(paths, options)}`,
      };
    })
    .toSorted((a, b) => comparePaths(a.file, b.file));
};
