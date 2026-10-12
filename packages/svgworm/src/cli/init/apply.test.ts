import {
  lstat,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { applyInit } from './apply.ts';
import { InitStatus, type InitPlan } from './plan.ts';

let root = '';

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'svgworm-init-apply-'));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const plan = (actions: InitPlan['actions']): InitPlan => ({
  actions,
  nextSteps: [],
});

describe('applyInit', () => {
  it('creates and updates planned files, and strips the content from the report', async () => {
    await writeFile(join(root, 'AGENTS.md'), '# app\n');
    const result = await applyInit(
      root,
      plan([
        {
          path: 'svgworm.config.json',
          status: InitStatus.CREATED,
          content: '{}\n',
        },
        {
          path: 'AGENTS.md',
          status: InitStatus.UPDATED,
          content: '# app\n\nicons\n',
          previous: '# app\n',
        },
        { path: 'x', status: InitStatus.UNCHANGED },
      ]),
    );
    expect(result.actions).toEqual([
      { path: 'svgworm.config.json', status: InitStatus.CREATED },
      { path: 'AGENTS.md', status: InitStatus.UPDATED },
      { path: 'x', status: InitStatus.UNCHANGED },
    ]);
    expect(await readFile(join(root, 'AGENTS.md'), 'utf8')).toBe(
      '# app\n\nicons\n',
    );
  });

  it('skips a file that appeared after planning instead of overwriting it', async () => {
    await writeFile(join(root, 'svgworm.config.json'), 'theirs');
    const result = await applyInit(
      root,
      plan([
        {
          path: 'svgworm.config.json',
          status: InitStatus.CREATED,
          content: 'ours',
        },
      ]),
    );
    expect(result.actions[0]).toMatchObject({
      status: InitStatus.SKIPPED,
      reason: expect.stringContaining('appeared') as string,
    });
    expect(await readFile(join(root, 'svgworm.config.json'), 'utf8')).toBe(
      'theirs',
    );
  });

  it('skips a file that changed after planning', async () => {
    await writeFile(join(root, 'package.json'), '{"name":"edited"}\n');
    const result = await applyInit(
      root,
      plan([
        {
          path: 'package.json',
          status: InitStatus.UPDATED,
          content: '{"name":"planned","scripts":{}}\n',
          previous: '{"name":"planned"}\n',
        },
      ]),
    );
    expect(result.actions[0]).toMatchObject({
      status: InitStatus.SKIPPED,
      reason: expect.stringContaining('changed') as string,
    });
    expect(await readFile(join(root, 'package.json'), 'utf8')).toBe(
      '{"name":"edited"}\n',
    );
  });

  it('never writes through a symlink', async () => {
    await writeFile(join(root, 'victim.txt'), 'keep');
    await symlink(join(root, 'victim.txt'), join(root, 'components-icon.tsx'));
    const created = await applyInit(
      root,
      plan([
        {
          path: 'components-icon.tsx',
          status: InitStatus.CREATED,
          content: 'x',
        },
      ]),
    );
    expect(created.actions[0]?.status).toBe(InitStatus.SKIPPED);
    const updated = await applyInit(
      root,
      plan([
        {
          path: 'components-icon.tsx',
          status: InitStatus.UPDATED,
          content: 'new',
          previous: 'keep',
        },
      ]),
    );
    expect(updated.actions[0]?.status).toBe(InitStatus.UPDATED);
    // The link was replaced by a regular file; the target was not touched.
    expect(await readFile(join(root, 'victim.txt'), 'utf8')).toBe('keep');
    expect(
      (await lstat(join(root, 'components-icon.tsx'))).isSymbolicLink(),
    ).toBe(false);
    expect(await readFile(join(root, 'components-icon.tsx'), 'utf8')).toBe(
      'new',
    );
  });
});
