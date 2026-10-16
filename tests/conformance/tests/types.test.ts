import { execFile } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { afterAll, beforeAll, describe, it } from 'vitest';

import {
  svelteComponentContent,
  vueComponentContent,
} from '../../../packages/svgworm/src/cli/init/plan.ts';

// Principle 4: the generated Icon.vue and Icon.svelte type-check, and an unknown icon name is a
// type error (types/App.vue and types/svelte-props.ts expect one).
const run = promisify(execFile);
const root = fileURLToPath(new URL('..', import.meta.url));
const project = join(root, 'types');
// Through node and the package's own bin file: the .bin shims are .cmd files on Windows.
const require = createRequire(import.meta.url);
const bin = (name: string): string => {
  const manifest = require.resolve(`${name}/package.json`);
  const { bin: entry } = require(manifest) as {
    bin: string | Record<string, string>;
  };
  return join(
    dirname(manifest),
    typeof entry === 'string' ? entry : (entry[name] ?? ''),
  );
};
const check = (name: string, args: readonly string[]) =>
  run(process.execPath, [bin(name), ...args], { cwd: project });

beforeAll(async () => {
  await mkdir(join(project, 'components'), { recursive: true });
  await writeFile(
    join(project, 'components/Icon.vue'),
    vueComponentContent('components/Icon.vue', 'svgworm'),
  );
  await writeFile(
    join(project, 'components/Icon.svelte'),
    svelteComponentContent('components/Icon.svelte', 'svgworm'),
  );
});

afterAll(async () => {
  await rm(join(project, 'components'), { recursive: true, force: true });
});

describe('generated components type-check', () => {
  it('Icon.vue passes vue-tsc', { timeout: 60_000 }, async () => {
    await check('vue-tsc', ['-p', 'tsconfig.vue.json']);
  });

  it('Icon.svelte passes svelte-check', { timeout: 60_000 }, async () => {
    await check('svelte-check', [
      '--tsconfig',
      './tsconfig.svelte.json',
      '--fail-on-warnings',
    ]);
  });
});
