import { join } from 'node:path';

import type { CompileResult, CompileSuccess, OutputFile } from './compile.ts';
import type { ResolvedConfig } from './config/resolve.ts';
import type { BuildEventHandler } from './events.ts';

import { compileFromDisk } from './build.ts';
import { compareCodePoints } from './compare-code-units.ts';
import { listDirectory, readIfPresent } from './fs.ts';
import { isOwnedFile, toReportPath } from './write.ts';

export const CheckStatus = {
  /** A generated file is not on disk. */
  MISSING: 'missing',
  /** The file on disk differs from what a build would write. */
  CHANGED: 'changed',
  /** A hashed sprite of an earlier build that a build would remove. */
  STALE: 'stale',
} as const;
export type CheckStatus = (typeof CheckStatus)[keyof typeof CheckStatus];

export type CheckEntry = {
  /** Path from `cwd`, `/`-separated. */
  readonly path: string;
  readonly status: CheckStatus;
};

/** Icon names in the new manifest but not in the committed one, and the reverse. */
export type IconDiff = {
  readonly added: readonly string[];
  readonly removed: readonly string[];
};

export type CheckOutcome = CompileSuccess & {
  readonly upToDate: boolean;
  /**
   * Every file a build would write or remove: expected files first, in write order, then
   * stale sprites. Empty when up to date.
   */
  readonly differences: readonly CheckEntry[];
  /** @deprecated The same list as `differences`; removed in the next minor. */
  readonly stale: readonly CheckEntry[];
  readonly iconDiff: IconDiff;
};

export type CheckResult =
  | CheckOutcome
  | Extract<CompileResult, { readonly ok: false }>;

const sameBytes = (a: Uint8Array, b: Uint8Array): boolean =>
  a.byteLength === b.byteLength && Buffer.from(a).equals(b);

const committedIconNames = async (
  path: string,
): Promise<readonly string[] | undefined> => {
  const bytes = await readIfPresent(path);
  if (bytes === undefined) return undefined;
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('icons' in parsed) ||
      typeof parsed.icons !== 'object' ||
      parsed.icons === null
    ) {
      return undefined;
    }
    return Object.keys(parsed.icons);
  } catch {
    return undefined;
  }
};

const diffNames = (
  before: readonly string[] | undefined,
  after: readonly string[],
): IconDiff => {
  const was = new Set(before ?? []);
  const now = new Set(after);
  return {
    added: after.filter((name) => !was.has(name)).toSorted(compareCodePoints),
    removed: [...was]
      .filter((name) => !now.has(name))
      .toSorted(compareCodePoints),
  };
};

const compareExpected = async (
  config: ResolvedConfig,
  files: readonly OutputFile[],
): Promise<readonly CheckEntry[]> => {
  const encoder = new TextEncoder();
  const entries: CheckEntry[] = [];
  for (const file of files) {
    const path = join(config.cwd, config[file.target], file.name);
    const onDisk = await readIfPresent(path);
    if (onDisk === undefined) {
      entries.push({
        path: toReportPath(config.cwd, path),
        status: CheckStatus.MISSING,
      });
    } else if (!sameBytes(encoder.encode(file.content), onDisk)) {
      entries.push({
        path: toReportPath(config.cwd, path),
        status: CheckStatus.CHANGED,
      });
    }
  }
  return entries;
};

const findStaleSprites = async (
  config: ResolvedConfig,
  files: readonly OutputFile[],
): Promise<readonly CheckEntry[]> => {
  const folder = join(config.cwd, config.outDir);
  const kept = new Set(
    files.filter((file) => file.target === 'outDir').map((file) => file.name),
  );
  // A missing outDir has no stale sprites; an unreadable one is an error, not a clean check.
  const names = await listDirectory(folder);
  return names
    .filter((name) => isOwnedFile(name) && !kept.has(name))
    .toSorted(compareCodePoints)
    .map((name) => ({
      path: toReportPath(config.cwd, join(folder, name)),
      status: CheckStatus.STALE,
    }));
};

/**
 * Compiles like `build` and compares the result with what is on disk, writing nothing (R-31).
 * `ok: false` means the input is invalid; `upToDate: false` means a build would change files.
 */
export const check = async (
  config: ResolvedConfig,
  onEvent: BuildEventHandler = () => undefined,
): Promise<CheckResult> => {
  const compiled = await compileFromDisk(config, onEvent);
  if (!compiled.ok) return compiled;

  const [expected, stale, before] = await Promise.all([
    compareExpected(config, compiled.files),
    findStaleSprites(config, compiled.files),
    committedIconNames(join(config.cwd, config.moduleDir, 'manifest.json')),
  ]);
  const entries = [...expected, ...stale];
  onEvent({ type: 'done', stats: compiled.stats });
  return {
    ...compiled,
    upToDate: entries.length === 0,
    differences: entries,
    stale: entries,
    iconDiff: diffNames(
      before,
      compiled.manifest.icons.map((icon) => icon.name),
    ),
  };
};
