import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import type { InitAction, InitPlan } from './plan.ts';

export type InitResult = {
  readonly actions: readonly InitAction[];
  readonly nextSteps: readonly string[];
};

/** Writes the `created` and `updated` files of a plan. Re-running the same plan is a no-op. */
export const applyInit = async (
  cwd: string,
  plan: InitPlan,
): Promise<InitResult> => {
  for (const action of plan.actions) {
    if (action.content === undefined) continue;
    const path = join(cwd, action.path);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, action.content);
  }
  return {
    actions: plan.actions.map(({ content: _content, ...rest }) => rest),
    nextSteps: plan.nextSteps,
  };
};
