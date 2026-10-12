import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { InitStatus, type InitAction, type InitPlan } from './plan.ts';

export type InitResult = {
  readonly actions: readonly InitAction[];
  readonly nextSteps: readonly string[];
};

const hasCode = (error: unknown, code: string): boolean =>
  error instanceof Error && 'code' in error && error.code === code;

const readIfPresent = async (path: string): Promise<string | undefined> => {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if (hasCode(error, 'ENOENT')) return undefined;
    throw error;
  }
};

/** Temp file plus rename: a crash leaves the old file intact, and a symlink is replaced, not followed. */
const replaceFile = async (path: string, content: string): Promise<void> => {
  const temporary = `${path}.${randomUUID().slice(0, 8)}.tmp`;
  try {
    await writeFile(temporary, content, { flag: 'wx' });
    await rename(temporary, path);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
};

const skipped = (action: InitAction, reason: string): InitAction => ({
  path: action.path,
  status: InitStatus.SKIPPED,
  reason,
});

/**
 * Writes one planned file. The plan was made from a snapshot of the folder, and prompts may
 * have taken a while, so a file that appeared or changed since is left alone and reported.
 */
const applyOne = async (
  cwd: string,
  action: InitAction,
): Promise<InitAction> => {
  const { content: _content, previous: _previous, ...reported } = action;
  if (action.content === undefined) return reported;
  const path = join(cwd, action.path);
  await mkdir(dirname(path), { recursive: true });
  if (action.status === InitStatus.CREATED) {
    try {
      // `wx` fails on anything already at the path, a symlink included.
      await writeFile(path, action.content, { flag: 'wx' });
    } catch (error) {
      if (!hasCode(error, 'EEXIST')) throw error;
      return skipped(action, 'appeared while init was running; run init again');
    }
    return reported;
  }
  if ((await readIfPresent(path)) !== action.previous) {
    return skipped(action, 'changed while init was running; run init again');
  }
  await replaceFile(path, action.content);
  return reported;
};

/** Writes the `created` and `updated` files of a plan. Re-running the same plan is a no-op. */
export const applyInit = async (
  cwd: string,
  plan: InitPlan,
): Promise<InitResult> => {
  const actions: InitAction[] = [];
  for (const action of plan.actions) {
    actions.push(await applyOne(cwd, action));
  }
  return { actions, nextSteps: plan.nextSteps };
};
