import { execFile } from 'node:child_process';
import { copyFile, mkdir, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { afterAll, beforeAll, describe, it } from 'vitest';

import {
  svelteComponentContent,
  svelteLoaderContent,
  vueComponentContent,
  vueLoaderContent,
} from '../../../packages/svgworm/src/cli/init/plan.ts';
import { build, resolveConfig } from '../../../packages/svgworm/src/index.ts';

// Principle 4: the generated Icon.vue and Icon.svelte type-check, and an unknown icon name is a
// type error (types/App.vue and types/svelte-props.ts expect one). The SvgwormLoader files of
// `init --cdn-url` (ADR-0036) type-check too. The manifest module and its types come from a real
// core build, so the check fails when the generated types drift from the components.
const run = promisify(execFile);
const root = fileURLToPath(new URL('..', import.meta.url));
const project = join(root, 'types');
const fixture = join(root, '../../fixtures/mono-fill/heroicons-home.svg');
// Everything the build and the component templates write, removed after the run.
const generated = ['icons', 'public', 'svgworm', 'components'];

const buildIcons = async (): Promise<void> => {
  await mkdir(join(project, 'icons'), { recursive: true });
  await copyFile(fixture, join(project, 'icons/home.svg'));
  const result = await build(resolveConfig({}, project));
  if (!result.ok) {
    throw new AggregateError(result.errors, 'svgworm build failed');
  }
};

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

const removeGenerated = () =>
  Promise.all(
    generated.map((dir) =>
      rm(join(project, dir), { recursive: true, force: true }),
    ),
  );

beforeAll(async () => {
  await removeGenerated();
  await buildIcons();
  await mkdir(join(project, 'components'), { recursive: true });
  await writeFile(
    join(project, 'components/Icon.vue'),
    vueComponentContent('components/Icon.vue', 'svgworm'),
  );
  await writeFile(
    join(project, 'components/Icon.svelte'),
    svelteComponentContent('components/Icon.svelte', 'svgworm'),
  );
  await writeFile(
    join(project, 'components/SvgwormLoader.vue'),
    vueLoaderContent('components/SvgwormLoader.vue', 'svgworm'),
  );
  await writeFile(
    join(project, 'components/SvgwormLoader.svelte'),
    svelteLoaderContent('components/SvgwormLoader.svelte', 'svgworm'),
  );
});

afterAll(removeGenerated);

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
