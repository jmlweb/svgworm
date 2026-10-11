import { compareCodePoints } from './compare-code-units.ts';
import { DiagnosticCode, type Diagnostic } from './errors.ts';

export type NamedPath = { readonly name: string; readonly path: string };

/** Output paths are NFC and `/`-separated (output contract, "Public name"). */
export const toDisplayPath = (path: string): string =>
  path.replaceAll('\\', '/').normalize('NFC');

/** One error per name produced by more than one file, listing every file (R-03). */
export const findCollisions = (
  entries: readonly NamedPath[],
): readonly Diagnostic[] => {
  const byName = Map.groupBy(entries, (entry) => entry.name);
  return [...byName.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([name, group]) => {
      const paths = group
        .map((entry) => toDisplayPath(entry.path))
        .toSorted(compareCodePoints);
      return {
        code: DiagnosticCode.NAME_COLLISION,
        file: paths[0] ?? name,
        message: `name "${name}" is produced by ${String(paths.length)} files: ${paths.join(', ')}`,
      };
    })
    .toSorted((a, b) => compareCodePoints(a.file, b.file));
};
