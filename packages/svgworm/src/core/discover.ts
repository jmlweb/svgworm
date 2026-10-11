import { lstat, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

import { toDisplayPath } from './collisions.ts';
import { compareCodePoints } from './compare-code-units.ts';
import { ConfigError, DiagnosticCode, type Diagnostic } from './errors.ts';

export type DiscoveredFile = {
  /** Path from `cwd`, NFC and `/`-separated. Used in messages and sorting. */
  readonly path: string;
  /** Path from its source folder, NFC and `/`-separated. Input of the naming rules. */
  readonly relativePath: string;
  /** Path to open on disk. */
  readonly absolutePath: string;
};

export type Discovery = {
  readonly files: readonly DiscoveredFile[];
  readonly errors: readonly Diagnostic[];
};

const utf8 = new TextDecoder('utf-8', { fatal: true });
const lossy = new TextDecoder('utf-8');

const decodeName = (
  bytes: Uint8Array,
): { readonly name: string; readonly isValid: boolean } => {
  try {
    return { name: utf8.decode(bytes), isValid: true };
  } catch {
    return { name: lossy.decode(bytes), isValid: false };
  }
};

const isSvgName = (name: string): boolean => /\.svg$/i.test(name);

type Walk = { files: DiscoveredFile[]; errors: Diagnostic[] };

const walk = async (
  directory: string,
  relative: string,
  sourcePrefix: string,
  out: Walk,
): Promise<void> => {
  // Read names as bytes: Node would silently turn undecodable names into U+FFFD (LRN-011).
  const entries = await readdir(directory, { encoding: 'buffer' });
  for (const bytes of entries) {
    const { name, isValid } = decodeName(bytes);
    if (name.startsWith('.')) continue;
    const entryRelative = relative === '' ? name : `${relative}/${name}`;
    const displayPath = toDisplayPath(`${sourcePrefix}/${entryRelative}`);
    if (!isValid) {
      // Report only names that could have been icons or folders of icons.
      out.errors.push({
        code: DiagnosticCode.INVALID_PATH_ENCODING,
        file: displayPath,
        message: 'file name is not valid Unicode (undecodable bytes)',
      });
      continue;
    }
    const absolute = join(directory, name);
    const stats = await lstat(absolute);
    if (stats.isSymbolicLink()) continue;
    if (stats.isDirectory()) {
      await walk(absolute, entryRelative, sourcePrefix, out);
    } else if (stats.isFile() && isSvgName(name)) {
      out.files.push({
        path: displayPath,
        relativePath: toDisplayPath(entryRelative),
        absolutePath: absolute,
      });
    }
  }
};

/** Finds the `.svg` files of every source folder, sorted by NFC path. Symlinks are skipped. */
export const discoverSvgFiles = async (
  cwd: string,
  sources: readonly string[],
): Promise<Discovery> => {
  const out: Walk = { files: [], errors: [] };
  for (const source of sources) {
    const directory = join(cwd, source);
    const stats = await lstat(directory).catch(() => undefined);
    if (stats?.isDirectory() !== true) {
      throw new ConfigError(`source folder not found: ${source}`);
    }
    const prefix = relative(cwd, directory).replaceAll('\\', '/');
    await walk(directory, '', prefix, out);
  }
  return {
    files: out.files.toSorted((a, b) => compareCodePoints(a.path, b.path)),
    errors: out.errors.toSorted((a, b) => compareCodePoints(a.file, b.file)),
  };
};
