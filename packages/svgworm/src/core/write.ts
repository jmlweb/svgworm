import { randomUUID } from 'node:crypto';
import {
  lstat,
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { join, relative } from 'node:path';

import type { OutputFile } from './compile.ts';
import type { BuildEventHandler } from './events.ts';

// The only files svgworm may delete: its own content-hashed sprite and stack (R-15).
const OWNED_FILE = /^icons(?:\.stack)?\.[0-9a-f]{8}\.svg$/;

export const isOwnedFile = (name: string): boolean => OWNED_FILE.test(name);

export type WriteTargets = {
  readonly cwd: string;
  readonly outDir: string;
  readonly moduleDir: string;
};

export type WriteResult = {
  /**
   * Every output file, as a path from `cwd` with `/` separators, in write order. A file whose
   * bytes did not change is listed but not rewritten, and emits no `write` event.
   */
  readonly written: readonly string[];
  readonly removed: readonly string[];
};

/** A path from `cwd` with `/` separators, as events and results report it. */
export const toReportPath = (cwd: string, absolute: string): string =>
  relative(cwd, absolute).replaceAll('\\', '/');

const isMissing = (error: unknown): boolean =>
  error instanceof Error && 'code' in error && error.code === 'ENOENT';

const readIfPresent = async (path: string): Promise<Buffer | undefined> => {
  try {
    return await readFile(path);
  } catch (error) {
    if (isMissing(error)) return undefined;
    throw error;
  }
};

/**
 * Writes through a temporary file in the same folder and renames it over the target, so a
 * reader never sees a half-written module and a symlink at the target is replaced, not
 * followed.
 */
const replaceFile = async (
  path: string,
  content: Uint8Array,
): Promise<void> => {
  const temporary = `${path}.${randomUUID().slice(0, 8)}.tmp`;
  try {
    await writeFile(temporary, content, { flag: 'wx' });
    await rename(temporary, path);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
};

const folderOf = (targets: WriteTargets, file: OutputFile): string =>
  join(targets.cwd, targets[file.target]);

const writeOne = async (
  targets: WriteTargets,
  file: OutputFile,
  onEvent: BuildEventHandler,
): Promise<string> => {
  const folder = folderOf(targets, file);
  await mkdir(folder, { recursive: true });
  const path = join(folder, file.name);
  const reported = toReportPath(targets.cwd, path);
  const content = new TextEncoder().encode(file.content);
  // Skipping an identical file keeps a dev server's file watcher quiet during `watch`.
  const current = await readIfPresent(path);
  if (current?.equals(content) === true) return reported;
  await replaceFile(path, content);
  onEvent({ type: 'write', path: reported, bytes: content.byteLength });
  return reported;
};

const removeStale = async (
  targets: WriteTargets,
  kept: ReadonlySet<string>,
  onEvent: BuildEventHandler,
): Promise<readonly string[]> => {
  const folder = join(targets.cwd, targets.outDir);
  const names = await readdir(folder);
  const stale = names
    .filter((name) => isOwnedFile(name) && !kept.has(name))
    .toSorted();
  const removed: string[] = [];
  for (const name of stale) {
    const path = join(folder, name);
    // A directory or symlink with a matching name is not ours.
    if (!(await lstat(path)).isFile()) continue;
    await rm(path);
    const reported = toReportPath(targets.cwd, path);
    removed.push(reported);
    onEvent({ type: 'remove', path: reported });
  }
  return removed;
};

/**
 * Writes the sprite and stack first, then the module, so a consumer never sees a manifest
 * that points at a file that does not exist yet. Stale hashed files go last (R-15).
 */
export const writeOutput = async (
  files: readonly OutputFile[],
  targets: WriteTargets,
  onEvent: BuildEventHandler = () => undefined,
): Promise<WriteResult> => {
  const ordered = [
    ...files.filter((file) => file.target === 'outDir'),
    ...files.filter((file) => file.target === 'moduleDir'),
  ];
  const written: string[] = [];
  for (const file of ordered) {
    written.push(await writeOne(targets, file, onEvent));
  }
  await mkdir(join(targets.cwd, targets.outDir), { recursive: true });
  const kept = new Set(
    files.filter((file) => file.target === 'outDir').map((file) => file.name),
  );
  return { written, removed: await removeStale(targets, kept, onEvent) };
};
