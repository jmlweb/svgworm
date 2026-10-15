import { lstat, readdir, stat } from 'node:fs/promises';
import { join, posix, relative } from 'node:path';

import { comparePaths, toDisplayPath } from './collisions.ts';
import { toSourceSpec, type SourceSpec } from './config/schema.ts';
import { ConfigError, DiagnosticCode, type Diagnostic } from './errors.ts';
import { toPosix } from './fs.ts';

export type DiscoveredFile = {
  /** Path from `cwd` as found on disk, `/`-separated. Used in messages. */
  readonly path: string;
  /** Path from its source folder as found on disk, `/`-separated. Input of the naming rules. */
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

type Walk = {
  files: DiscoveredFile[];
  errors: Diagnostic[];
  /** Decides per file, on its `/`-separated path inside the source folder. */
  readonly keep: (relativePath: string) => boolean;
};

/**
 * `include` and `exclude` are globs on the path inside the source folder (output contract
 * naming input), matched with `path.matchesGlob`: `*`, `**`, `?`, `[…]` and `{a,b}`.
 */
const toFilter = (source: SourceSpec): Walk['keep'] => {
  const { include, exclude } = source;
  const matches = (globs: readonly string[], path: string): boolean =>
    globs.some((glob) => posix.matchesGlob(path, glob));
  return (path) =>
    (include === undefined || matches(include, path)) &&
    (exclude === undefined || !matches(exclude, path));
};

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
    } else if (stats.isFile() && isSvgName(name) && out.keep(entryRelative)) {
      out.files.push({
        path: displayPath,
        relativePath: entryRelative,
        absolutePath: absolute,
      });
    }
  }
};

/**
 * Finds the `.svg` files of every source folder, sorted by NFC path. Symlinks inside a folder
 * are skipped; the folder itself may be one (a package in a pnpm `node_modules`).
 */
export const discoverSvgFiles = async (
  cwd: string,
  sources: readonly (string | SourceSpec)[],
): Promise<Discovery> => {
  const files: DiscoveredFile[] = [];
  const errors: Diagnostic[] = [];
  for (const entry of sources) {
    const source = toSourceSpec(entry);
    const directory = join(cwd, source.dir);
    const stats = await stat(directory).catch(() => undefined);
    if (stats?.isDirectory() !== true) {
      throw new ConfigError(`source folder not found: ${source.dir}`);
    }
    const prefix = toPosix(relative(cwd, directory));
    await walk(directory, '', prefix, {
      files,
      errors,
      keep: toFilter(source),
    });
  }
  return {
    files: files.toSorted((a, b) => comparePaths(a.path, b.path)),
    errors: errors.toSorted((a, b) => comparePaths(a.file, b.file)),
  };
};
