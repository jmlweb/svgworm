import { randomUUID } from 'node:crypto';
import { readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';

/*
 * The few file-system helpers that carry policy: which errors mean "not there" and how a
 * file is replaced. Core and CLI share them so the behavior cannot drift (RPT-003).
 */

export const hasErrorCode = (error: unknown, code: string): boolean =>
  error instanceof Error && 'code' in error && error.code === code;

/** Only a missing file is "missing"; a permission or type error is reported, not hidden. */
export const isMissing = (error: unknown): boolean =>
  hasErrorCode(error, 'ENOENT');

export const readIfPresent = async (
  path: string,
): Promise<Buffer | undefined> => {
  try {
    return await readFile(path);
  } catch (error) {
    if (isMissing(error)) return undefined;
    throw error;
  }
};

export const readTextIfPresent = async (
  path: string,
): Promise<string | undefined> => {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if (isMissing(error)) return undefined;
    throw error;
  }
};

/** Entry names of a folder, or none when the folder does not exist. Other errors throw. */
export const listDirectory = async (
  path: string,
): Promise<readonly string[]> => {
  try {
    return await readdir(path);
  } catch (error) {
    if (isMissing(error)) return [];
    throw error;
  }
};

/**
 * Writes through a temporary file in the same folder and renames it over the target, so a
 * reader never sees a half-written file, a crash leaves the old file intact, and a symlink
 * at the target is replaced, not followed.
 */
export const replaceFile = async (
  path: string,
  content: string | Uint8Array,
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

/** `/` separators on every OS, as paths are reported, sorted and written into modules. */
export const toPosix = (path: string): string => path.replaceAll('\\', '/');
