import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import type { FirstBuild } from './first-build.ts';

import { hasErrorCode, readTextIfPresent, replaceFile } from '../../core/fs.ts';
import { InitStatus, type InitAction, type InitPlan } from './plan.ts';

export type InitResult = Pick<
  InitPlan,
  'framework' | 'frameworkSource' | 'actions' | 'nextSteps'
>;

/** What `init` reports: the files it looked at, then the first build. */
export type InitReport = InitResult & { readonly build: FirstBuild };

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
      if (!hasErrorCode(error, 'EEXIST')) throw error;
      return skipped(action, 'appeared while init was running; run init again');
    }
    return reported;
  }
  if ((await readTextIfPresent(path)) !== action.previous) {
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
  return {
    framework: plan.framework,
    frameworkSource: plan.frameworkSource,
    actions,
    nextSteps: plan.nextSteps,
  };
};
